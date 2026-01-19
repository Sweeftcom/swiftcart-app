-- Geofencing, Monitoring, and Signal Resilience Foundations

-- 1. App Error Logging Table
CREATE TABLE IF NOT EXISTS public.app_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enhanced Driver Tracking Columns
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS is_at_store BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_known_area TEXT,
ADD COLUMN IF NOT EXISTS offline_buffer_count INTEGER DEFAULT 0;

-- 3. RLS for Error Logging
ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own errors" ON public.app_errors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all errors" ON public.app_errors FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. Index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_app_errors_type_created ON public.app_errors (error_type, created_at);

-- 5. Function to bulk sync offline coordinates (Conceptual)
CREATE OR REPLACE FUNCTION public.sync_offline_coordinates(
  p_driver_id UUID,
  p_coordinates JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In a production app, this would update a separate historical tracking table.
  -- For now, we update the driver's current status and increment the sync count.
  UPDATE public.drivers
  SET current_lat = (p_coordinates->0->>'lat')::DOUBLE PRECISION,
      current_lng = (p_coordinates->0->>'lng')::DOUBLE PRECISION,
      offline_buffer_count = offline_buffer_count + jsonb_array_length(p_coordinates),
      updated_at = now()
  WHERE id = p_driver_id;
END;
$$;
