-- Professional Order Lifecycle RPCs & Production RLS

-- 1. Atomic Order Placement with Inventory Check
CREATE OR REPLACE FUNCTION public.place_order_atomic(p_order_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_store_id UUID;
  v_total NUMERIC := 0;
BEGIN
  v_store_id := (p_order_data->>'store_id')::UUID;

  -- 1. Create Order
  INSERT INTO public.orders (
    user_id, store_id, address_id, status, subtotal, delivery_fee,
    surge_fee, discount, total, payment_method, payment_status,
    estimated_delivery_minutes, estimated_delivery_time
  ) VALUES (
    (p_order_data->>'user_id')::UUID,
    v_store_id,
    (p_order_data->>'address_id')::UUID,
    'placed',
    (p_order_data->>'subtotal')::NUMERIC,
    (p_order_data->>'delivery_fee')::NUMERIC,
    (p_order_data->>'surge_fee')::NUMERIC,
    (p_order_data->>'discount')::NUMERIC,
    (p_order_data->>'total')::NUMERIC,
    p_order_data->>'payment_method',
    'pending',
    (p_order_data->>'estimated_delivery_minutes')::INTEGER,
    (NOW() + INTERVAL '1 minute' * (p_order_data->>'estimated_delivery_minutes')::INTEGER)
  ) RETURNING id INTO v_order_id;

  -- 2. Process Items and Atomic Inventory Check
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_order_data->'items') AS x(product_id UUID, quantity INTEGER, price NUMERIC)
  LOOP
    -- Insert into order_items
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price, mrp)
    VALUES (v_order_id, v_item.product_id, 'Product Name Placeholder', v_item.quantity, v_item.price, v_item.price);

    -- Atomic stock reduction
    UPDATE public.store_inventory
    SET quantity = quantity - v_item.quantity,
        updated_at = now()
    WHERE store_id = v_store_id AND product_id = v_item.product_id;

    -- Check if stock went negative
    IF EXISTS (SELECT 1 FROM public.store_inventory WHERE store_id = v_store_id AND product_id = v_item.product_id AND quantity < 0) THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item.product_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'status', 'placed');
END;
$$;

-- 2. Enhanced RLS Policies for 4-App Ecosystem

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers view assigned orders" ON public.orders FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

-- 3. Professional Lifecycle RPCs

CREATE OR REPLACE FUNCTION public.accept_order_by_vendor(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND status = 'placed') THEN
    UPDATE public.orders SET status = 'confirmed', updated_at = now() WHERE id = p_order_id;
    INSERT INTO public.order_status_history (order_id, status, note) VALUES (p_order_id, 'confirmed', 'Accepted by vendor');
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_order_ready(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND status = 'confirmed') THEN
    UPDATE public.orders SET status = 'packing', updated_at = now() WHERE id = p_order_id;
    INSERT INTO public.order_status_history (order_id, status, note) VALUES (p_order_id, 'packing', 'Order is being packed and ready');
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
