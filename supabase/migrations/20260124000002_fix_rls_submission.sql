-- Fix RLS and Submission Errors for Master Project

-- 1. Ensure Drivers table exists and is correctly structured
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
  aadhar_url TEXT,
  pan_url TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  rating NUMERIC(2,1) DEFAULT 4.5,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Ensure Vendors table exists
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

-- 3. Enable RLS and add PERMISSIVE INSERT policies
-- This stops the 'Submission Failed' errors by allowing the apps to save registration data.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert for registration" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow individual update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public driver insert" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow driver self update" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow public driver select" ON public.drivers FOR SELECT USING (true);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public vendor insert" ON public.vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow vendor self view" ON public.vendors FOR SELECT USING (auth.uid() = user_id);

-- 4. Storage Policies for Document Uploads
-- Note: Requires a bucket named 'documents' to be created in Supabase UI first.
-- These policies allow authenticated users to upload their verification docs.
-- (Conceptually adding here for documentation)
-- CREATE POLICY "Allow authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
