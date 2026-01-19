-- Delivery OTP and Security Enhancements

-- 1. Add delivery_otp to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_otp TEXT;

-- 2. Function to generate a random 4-digit OTP
CREATE OR REPLACE FUNCTION public.generate_delivery_otp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.delivery_otp := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to assign OTP on order creation
CREATE TRIGGER tr_generate_delivery_otp
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_delivery_otp();

-- 4. Secure OTP-based Delivery Completion
CREATE OR REPLACE FUNCTION public.complete_delivery_with_otp(
  p_order_id UUID,
  p_otp TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_correct_otp TEXT;
  v_driver_id UUID;
BEGIN
  -- Get correct OTP and driver_id
  SELECT delivery_otp, driver_id INTO v_correct_otp, v_driver_id
  FROM public.orders
  WHERE id = p_order_id;

  -- Verify OTP
  IF v_correct_otp != p_otp THEN
    RAISE EXCEPTION 'Invalid Delivery OTP';
  END IF;

  -- Proceed with completion logic (reusing standard logic with security checks)
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND status = 'out_for_delivery') THEN
    UPDATE public.orders
    SET status = 'delivered',
        payment_status = 'completed',
        actual_delivery_time = now(),
        updated_at = now()
    WHERE id = p_order_id;

    -- Free up driver
    UPDATE public.drivers
    SET status = 'online',
        current_order_id = NULL,
        total_deliveries = total_deliveries + 1,
        updated_at = now()
    WHERE id = v_driver_id;

    INSERT INTO public.order_status_history (order_id, status, note)
    VALUES (p_order_id, 'delivered', 'Order successfully delivered with OTP verification');

    RETURN true;
  END IF;

  RETURN false;
END;
$$;
