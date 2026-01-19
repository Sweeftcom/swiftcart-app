-- Operational Command Center Enhancements

-- 1. Wallets and Referral System
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_amount NUMERIC(10,2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- 2. Chat System for Customer-Rider Communication
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Dynamic Surge and Order Metadata
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparation_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escalation_status TEXT DEFAULT 'none' CHECK (escalation_status IN ('none', 'warning', 'urgent'));

-- 4. Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Order participants can view chat" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = chat_messages.order_id
    AND (orders.user_id = auth.uid() OR orders.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
  )
);
CREATE POLICY "Order participants can send chat" ON public.chat_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = chat_messages.order_id
    AND (orders.user_id = auth.uid() OR orders.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
  )
);

-- 5. Helper function for Referral Reward
CREATE OR REPLACE FUNCTION public.reward_referral(p_referred_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_reward NUMERIC;
BEGIN
  SELECT referrer_id, reward_amount INTO v_referrer_id, v_reward
  FROM public.referrals
  WHERE referred_id = p_referred_id AND status = 'pending';

  IF v_referrer_id IS NOT NULL THEN
    -- Update referral status
    UPDATE public.referrals SET status = 'completed' WHERE referred_id = p_referred_id;

    -- Credit Referrer
    INSERT INTO public.wallets (user_id, balance)
    VALUES (v_referrer_id, v_reward)
    ON CONFLICT (user_id) DO UPDATE SET balance = public.wallets.balance + v_reward;

    -- Credit Referred Friend
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_referred_id, v_reward)
    ON CONFLICT (user_id) DO UPDATE SET balance = public.wallets.balance + v_reward;
  END IF;
END;
$$;
