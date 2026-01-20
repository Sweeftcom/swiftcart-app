-- Unify Schema and Permissions for 4-App Ecosystem

-- 1. Ensure Drivers table exists in master project
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  vehicle_type TEXT DEFAULT 'bike',
  vehicle_number TEXT,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  rating NUMERIC(2,1) DEFAULT 4.5,
  total_deliveries INTEGER DEFAULT 0,
  aadhar_url TEXT,
  pan_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create Vendors table (Store owners)
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  store_id UUID REFERENCES public.stores(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS Permissions: Enable INSERT for registration (Anon/Authenticated)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all during registration" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for registration" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for tracking" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Enable update for own record" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for vendor registration" ON public.vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for vendor view" ON public.vendors FOR SELECT USING (auth.uid() = user_id);

-- 4. Storage Bucket for Documents
-- Note: Buckets are usually created via UI or API, but we ensure policies exist
-- In Supabase, you'd create 'documents' bucket manually or via scripts.

-- 5. Location Storage on Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_address TEXT;
