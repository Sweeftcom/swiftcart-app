-- FinTech and Zone Management Foundations

-- 1. Enable PostGIS for spatial queries if possible
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Zone Management
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  polygon GEOMETRY(Polygon, 4326), -- PostGIS Polygon
  base_delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 20.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Wallet Transactions (Audit Log)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN ('order_earning', 'referral_bonus', 'withdrawal', 'refund', 'adjustment')),
  description TEXT,
  reference_id UUID, -- Links to order_id, payout_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  amount NUMERIC(10,2) NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Secure Withdrawal RPC (Atomic with Double-Spending Protection)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_driver_id UUID,
  p_amount NUMERIC,
  p_upi_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_payout_id UUID;
BEGIN
  -- Get user_id from driver
  SELECT user_id INTO v_user_id FROM public.drivers WHERE id = p_driver_id;

  -- Get wallet and lock the row for update (Double-spending protection)
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- 1. Validation
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  IF p_amount < 500 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is ₹500';
  END IF;

  -- 2. Create Payout Request
  INSERT INTO public.payout_requests (driver_id, amount, upi_id)
  VALUES (p_driver_id, p_amount, p_upi_id)
  RETURNING id INTO v_payout_id;

  -- 3. Deduct from Wallet
  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;

  -- 4. Log Transaction
  INSERT INTO public.wallet_transactions (wallet_id, amount, type, category, description, reference_id)
  VALUES (v_wallet_id, p_amount, 'debit', 'withdrawal', 'Payout request initiated to ' || p_upi_id, v_payout_id);

  RETURN jsonb_build_object('success', true, 'payout_id', v_payout_id);
END;
$$;

-- 6. Helper function to find zone for a point
CREATE OR REPLACE FUNCTION public.get_zone_for_location(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_zone_id UUID;
BEGIN
  SELECT id INTO v_zone_id
  FROM public.zones
  WHERE is_active = true
    AND ST_Contains(polygon, ST_SetSRID(ST_Point(p_lng, p_lat), 4326))
  LIMIT 1;

  RETURN v_zone_id;
END;
$$;

-- 7. RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active zones" ON public.zones FOR SELECT USING (is_active = true);
CREATE POLICY "Drivers can view their own payout requests" ON public.payout_requests FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions FOR SELECT USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));
