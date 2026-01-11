-- Create OTP rate limiting table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_phone ON public.otp_rate_limits(phone, created_at);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_ip ON public.otp_rate_limits(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_expires ON public.otp_rate_limits(expires_at);

-- Enable RLS
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no user access)
-- No RLS policies needed as this is server-side only

-- Create OTP verification attempts table for lockout
CREATE TABLE IF NOT EXISTS public.otp_verify_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_verify_attempts_phone ON public.otp_verify_attempts(phone, created_at);

-- Enable RLS
ALTER TABLE public.otp_verify_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no user access needed)

-- Clean up old OTP records (function to be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete expired OTP rate limits
  DELETE FROM public.otp_rate_limits WHERE expires_at < NOW();
  
  -- Delete old verification attempts (older than 24 hours)
  DELETE FROM public.otp_verify_attempts WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- =====================================================
-- FIX: Restrict orders update policy to prevent fraud
-- =====================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create secure function for order cancellation
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status TEXT;
  v_order_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate user owns order and it's cancellable
  SELECT status, created_at INTO v_order_status, v_order_created_at
  FROM orders 
  WHERE id = p_order_id 
  AND user_id = auth.uid();
  
  IF v_order_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order_status NOT IN ('placed', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled at this stage');
  END IF;
  
  -- Allow cancellation within 10 minutes of order placement
  IF v_order_created_at < NOW() - INTERVAL '10 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cancellation window has expired');
  END IF;
  
  -- Update order status
  UPDATE orders 
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id AND user_id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'message', 'Order cancelled successfully');
END;
$$;

-- Create secure function for order rating
CREATE OR REPLACE FUNCTION public.rate_order(
  p_order_id UUID,
  p_rating INTEGER,
  p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status TEXT;
BEGIN
  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rating must be between 1 and 5');
  END IF;
  
  -- Validate user owns order and it's delivered
  SELECT status INTO v_order_status
  FROM orders 
  WHERE id = p_order_id 
  AND user_id = auth.uid();
  
  IF v_order_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order_status != 'delivered' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can only rate delivered orders');
  END IF;
  
  -- Update order with rating
  UPDATE orders 
  SET 
    rating = p_rating,
    feedback = p_feedback,
    updated_at = NOW()
  WHERE id = p_order_id AND user_id = auth.uid();
  
  RETURN jsonb_build_object('success', true, 'message', 'Thank you for your feedback');
END;
$$;

-- =====================================================
-- FIX: Restrict drivers table access (protect sensitive data)
-- =====================================================

-- Drop the public access policy
DROP POLICY IF EXISTS "Anyone can view drivers" ON public.drivers;

-- Create function to check if user has active order with driver
CREATE OR REPLACE FUNCTION public.user_has_order_with_driver(p_driver_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders
    WHERE user_id = auth.uid()
    AND driver_id = p_driver_id
    AND status IN ('confirmed', 'packing', 'out_for_delivery')
  );
$$;

-- Policy: Users can only see drivers assigned to their active orders
CREATE POLICY "Users can view assigned driver" 
ON public.drivers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND public.user_has_order_with_driver(id)
);

-- Note: Admins/staff would need separate policies via role-based access