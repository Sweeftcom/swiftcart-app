-- Auth and Verification Fix: Profiles and Wallets

-- 1. Create Document Status Enum if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE public.document_status AS ENUM ('pending', 'verified', 'rejected');
  END IF;
END $$;

-- 2. Update Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS document_status public.document_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS manual_address_override TEXT;

-- 3. Update handle_new_user function to initialize wallets
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, phone, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );

  -- Initialize Wallet for every new user (Customer, Vendor, or Driver)
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Audit Log for Document Status Changes
CREATE TABLE IF NOT EXISTS public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  old_status public.document_status,
  new_status public.document_status,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all logs" ON public.verification_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);
