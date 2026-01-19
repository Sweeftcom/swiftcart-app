-- Pilot Operational Tools and Insights

-- 1. Pilot Insights Table for Post-Delivery Feedback
CREATE TABLE IF NOT EXISTS public.pilot_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  was_fast BOOLEAN,
  rider_polite BOOLEAN,
  app_glitches TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Secure Admin Re-assignment Function
CREATE OR REPLACE FUNCTION public.reassign_order_manually(
  p_order_id UUID,
  p_new_driver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_driver_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can manually re-assign orders';
  END IF;

  -- Get current driver
  SELECT driver_id INTO v_old_driver_id FROM public.orders WHERE id = p_order_id;

  -- 1. Release old driver if they exist
  IF v_old_driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET status = 'online', current_order_id = NULL
    WHERE id = v_old_driver_id;
  END IF;

  -- 2. Assign to new driver
  UPDATE public.orders
  SET driver_id = p_new_driver_id,
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.drivers
  SET status = 'busy', current_order_id = p_order_id
  WHERE id = p_new_driver_id;

  -- 3. Log the change
  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (p_order_id, 'out_for_delivery', 'Admin re-assigned order to new rider');

  RETURN true;
END;
$$;

-- 3. RLS Policies
ALTER TABLE public.pilot_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.pilot_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all insights" ON public.pilot_insights
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
