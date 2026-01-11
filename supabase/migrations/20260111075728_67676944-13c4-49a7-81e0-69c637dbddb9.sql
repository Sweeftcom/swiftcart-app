-- Create email OTP rate limits table
CREATE TABLE IF NOT EXISTS public.email_otp_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE public.email_otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- No user access - only edge functions with service role can access
-- Create index for faster lookups
CREATE INDEX idx_email_otp_rate_limits_email ON public.email_otp_rate_limits(email);
CREATE INDEX idx_email_otp_rate_limits_ip ON public.email_otp_rate_limits(ip_address);
CREATE INDEX idx_email_otp_rate_limits_expires ON public.email_otp_rate_limits(expires_at);

-- Cleanup function for expired email OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_email_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.email_otp_rate_limits WHERE expires_at < NOW();
END;
$function$;