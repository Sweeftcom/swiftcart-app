-- Fix: Create a secure view for customer access to driver information
-- This masks sensitive data like phone numbers, vehicle numbers, and provides approximate location

-- Create a function to get driver data for the currently active order
-- This is a SECURITY DEFINER function that returns masked driver data
CREATE OR REPLACE FUNCTION public.get_driver_for_order(p_order_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  vehicle_type text,
  rating numeric,
  phone_masked text,
  current_lat_approx double precision,
  current_lng_approx double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.name,
    d.avatar_url,
    d.vehicle_type,
    d.rating,
    -- Mask phone number (show last 4 digits only)
    CASE 
      WHEN d.phone IS NOT NULL THEN 'XXXXXX' || RIGHT(d.phone, 4)
      ELSE NULL 
    END as phone_masked,
    -- Provide approximate location (rounded to 2 decimals = ~1km accuracy)
    ROUND(d.current_lat::numeric, 2)::double precision as current_lat_approx,
    ROUND(d.current_lng::numeric, 2)::double precision as current_lng_approx
  FROM public.drivers d
  INNER JOIN public.orders o ON o.driver_id = d.id
  WHERE o.id = p_order_id 
    AND o.user_id = auth.uid()
    AND o.status IN ('confirmed', 'packing', 'out_for_delivery');
$$;

-- Drop the existing permissive policy on drivers table
DROP POLICY IF EXISTS "Users can view assigned driver" ON public.drivers;

-- No SELECT policy needed on drivers table for regular users
-- All driver access goes through the secure RPC function get_driver_for_order
-- Admins would need a separate policy if direct table access is required