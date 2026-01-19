-- Scale and Growth: Subscriptions and Marketing

-- 1. Sweeftcom Plus Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enhanced Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  usage_limit INTEGER DEFAULT 1000,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND (expiry_date IS NULL OR expiry_date > now()));

CREATE POLICY "Admins manage subscriptions" ON public.subscriptions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- 4. Function to apply coupon and check validity
CREATE OR REPLACE FUNCTION public.apply_coupon(p_code TEXT, p_order_value NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE code = p_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Coupon not found');
  END IF;

  IF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date < now() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Coupon expired');
  END IF;

  IF v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usage limit reached');
  END IF;

  IF p_order_value < v_coupon.min_order_value THEN
    RETURN jsonb_build_object('success', false, 'message', 'Minimum order value not met');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'max_discount', v_coupon.max_discount
  );
END;
$$;
