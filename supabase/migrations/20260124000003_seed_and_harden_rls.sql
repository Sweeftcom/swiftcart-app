-- 1. Seed Database with Aurangabad Initial Data

-- Seed Categories
INSERT INTO public.categories (name, slug, sort_order, is_active) VALUES
('Dairy & Bread', 'dairy-bread', 1, true),
('Vegetables & Fruits', 'vegetables-fruits', 2, true),
('Snacks & Drinks', 'snacks-drinks', 3, true),
('Meat & Eggs', 'meat-eggs', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Stores
INSERT INTO public.stores (name, type, address, city, lat, lng, is_open) VALUES
('Nirala Bazar Dark Store', 'dark_store', 'Nirala Bazar, Aurangabad', 'Aurangabad', 19.8762, 75.3433, true),
('CIDCO N-Series Store', 'dark_store', 'CIDCO N-5, Aurangabad', 'Aurangabad', 19.8821, 75.3670, true)
ON CONFLICT DO NOTHING;

-- Seed Products
DO $$
DECLARE
    dairy_id UUID;
    veg_id UUID;
    nirala_store_id UUID;
BEGIN
    SELECT id INTO dairy_id FROM public.categories WHERE slug = 'dairy-bread';
    SELECT id INTO veg_id FROM public.categories WHERE slug = 'vegetables-fruits';
    SELECT id INTO nirala_store_id FROM public.stores WHERE name = 'Nirala Bazar Dark Store';

    IF dairy_id IS NOT NULL AND nirala_store_id IS NOT NULL THEN
        INSERT INTO public.products (name, slug, description, category_id, store_id, price, mrp, unit, is_available) VALUES
        ('Amul Taaza Milk 500ml', 'amul-taaza-500', 'Fresh toned milk', dairy_id, nirala_store_id, 27.00, 28.00, 'packet', true),
        ('Modern Bread 400g', 'modern-bread-400', 'Whole wheat bread', dairy_id, nirala_store_id, 40.00, 45.00, 'packet', true)
        ON CONFLICT (slug) DO NOTHING;
    END IF;

    IF veg_id IS NOT NULL AND nirala_store_id IS NOT NULL THEN
        INSERT INTO public.products (name, slug, description, category_id, store_id, price, mrp, unit, is_available) VALUES
        ('Organic Onions 1kg', 'onions-1kg', 'Fresh red onions', veg_id, nirala_store_id, 35.00, 40.00, 'kg', true),
        ('Fresh Tomatoes 500g', 'tomatoes-500g', 'Vine ripened tomatoes', veg_id, nirala_store_id, 20.00, 25.00, '500g', true)
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- 2. Harden RLS Policies for 4-App Operations

-- Addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles
DROP POLICY IF EXISTS "Allow insert for registration" ON public.profiles;
CREATE POLICY "Allow public insert during registration" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Drivers
DROP POLICY IF EXISTS "Drivers manage own data" ON public.drivers;
CREATE POLICY "Drivers manage own data" ON public.drivers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vendors
DROP POLICY IF EXISTS "Vendors manage own data" ON public.vendors;
CREATE POLICY "Vendors manage own data" ON public.vendors
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Initialize Aurangabad locations for search backup
INSERT INTO public.aurangabad_locations (name, type, lat, lng, is_serviceable) VALUES
('Nirala Bazar', 'area', 19.8762, 75.3433, true),
('CIDCO N-5', 'area', 19.8821, 75.3670, true),
('Garkheda', 'area', 19.8655, 75.3522, true),
('Osmanpura', 'area', 19.8690, 75.3340, true)
ON CONFLICT DO NOTHING;
