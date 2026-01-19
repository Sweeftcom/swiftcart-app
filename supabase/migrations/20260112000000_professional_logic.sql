-- Professional Logic Migration for Quick Commerce Platform

-- 1. Role Management
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('customer', 'vendor', 'driver', 'admin');
  END IF;
END $$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'customer';

-- 2. Inventory System (Multi-store support)
CREATE TABLE IF NOT EXISTS public.store_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  is_available BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- 3. Driver & Order Assignments
-- Ensure drivers table has necessary columns for real-time tracking
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'busy')),
ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES public.orders(id),
ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS public.order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'rejected', 'timed_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Financials (Payouts)
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  type TEXT NOT NULL CHECK (type IN ('vendor_payout', 'driver_earnings')),
  reference_id TEXT, -- Bank transaction ID
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Reviews System
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.driver_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Helper Functions (RPCs)

-- Function to find nearby drivers
CREATE OR REPLACE FUNCTION public.get_nearby_drivers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.phone,
    (6371 * acos(cos(radians(p_lat)) * cos(radians(d.current_lat)) * cos(radians(d.current_lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(d.current_lat)))) AS distance_km
  FROM public.drivers d
  WHERE d.is_available = true
    AND d.status = 'online'
    AND d.current_lat IS NOT NULL
    AND d.current_lng IS NOT NULL
    AND (6371 * acos(cos(radians(p_lat)) * cos(radians(d.current_lat)) * cos(radians(d.current_lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(d.current_lat)))) <= p_radius_km
  ORDER BY distance_km ASC;
END;
$$;

-- Function to update inventory
CREATE OR REPLACE FUNCTION public.update_inventory_stock(
  p_store_id UUID,
  p_product_id UUID,
  p_change INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.store_inventory (store_id, product_id, quantity)
  VALUES (p_store_id, p_product_id, p_change)
  ON CONFLICT (store_id, product_id)
  DO UPDATE SET
    quantity = public.store_inventory.quantity + p_change,
    updated_at = now();
END;
$$;

-- Function to assign order to driver
CREATE OR REPLACE FUNCTION public.assign_order_to_driver(
  p_order_id UUID,
  p_driver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assigned BOOLEAN;
BEGIN
  -- Check if order is still available for assignment
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND driver_id IS NULL AND status IN ('placed', 'confirmed', 'packing')) THEN
    UPDATE public.orders
    SET driver_id = p_driver_id,
        status = 'out_for_delivery',
        updated_at = now()
    WHERE id = p_order_id;

    UPDATE public.drivers
    SET status = 'busy',
        current_order_id = p_order_id,
        updated_at = now()
    WHERE id = p_driver_id;

    INSERT INTO public.order_assignments (order_id, driver_id, status)
    VALUES (p_order_id, p_driver_id, 'accepted');

    v_assigned := true;
  ELSE
    v_assigned := false;
  END IF;

  RETURN v_assigned;
END;
$$;

-- RLS Policies for new tables
ALTER TABLE public.store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

-- Basic policies (to be refined based on roles later)
CREATE POLICY "Vendors can manage their inventory" ON public.store_inventory
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'vendor' OR role = 'admin'));

CREATE POLICY "Everyone can view inventory" ON public.store_inventory
  FOR SELECT USING (true);

CREATE POLICY "Drivers can see their assignments" ON public.order_assignments
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.drivers WHERE id = driver_id));

CREATE POLICY "Users can see their payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can see store reviews" ON public.store_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can see driver reviews" ON public.driver_reviews FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_store_inventory_updated_at BEFORE UPDATE ON public.store_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_assignments_updated_at BEFORE UPDATE ON public.order_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
