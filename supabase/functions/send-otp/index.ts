import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  phone: string;
}

// Rate limiting configuration
const RATE_LIMIT_PER_PHONE = 3; // Max 3 OTPs per phone per hour
const RATE_LIMIT_PER_IP = 5; // Max 5 OTPs per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function checkRateLimit(supabase: any, phone: string, ip: string): Promise<{ allowed: boolean; message?: string }> {
  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Check phone rate limit
  const { count: phoneCount } = await supabase
    .from('otp_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('phone', normalizedPhone)
    .gte('created_at', windowStart);
  
  if ((phoneCount || 0) >= RATE_LIMIT_PER_PHONE) {
    return { allowed: false, message: "Too many OTP requests for this phone number. Please try again later." };
  }
  
  // Check IP rate limit
  const { count: ipCount } = await supabase
    .from('otp_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', windowStart);
  
  if ((ipCount || 0) >= RATE_LIMIT_PER_IP) {
    return { allowed: false, message: "Too many OTP requests from this location. Please try again later." };
  }
  
  return { allowed: true };
}

async function recordRateLimitAttempt(supabase: any, phone: string, ip: string, otp: string): Promise<void> {
  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
  
  await supabase
    .from('otp_rate_limits')
    .insert({
      phone: normalizedPhone,
      ip_address: ip,
      otp_hash: await hashOtp(otp),
      expires_at: expiresAt
    });
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendFast2SMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = Deno.env.get("FAST2SMS_API_KEY");

  if (!apiKey) {
    console.error("[INTERNAL] SMS service configuration error");
    throw new Error("Unable to send verification code. Please try again later.");
  }

  // Normalize phone number (remove +91 or any prefix, keep last 10 digits)
  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  const url = "https://www.fast2sms.com/dev/bulkV2";
  const message = `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  
  const params = new URLSearchParams({
    authorization: apiKey,
    route: "q",
    message: message,
    flash: "0",
    numbers: normalizedPhone,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
    headers: {
      "cache-control": "no-cache",
    },
  });

  const data = await response.json();
  
  if (!data.return) {
    console.error("[INTERNAL] SMS delivery failed");
    throw new Error("Unable to send verification code. Please try again later.");
  }

  console.log(`OTP sent successfully to phone ending in ***${normalizedPhone.slice(-4)}`);
  return true;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone }: OtpRequest = await req.json();

    if (!phone || phone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check rate limits
    const rateLimitResult = await checkRateLimit(supabase, phone, ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOtp();

    // Record rate limit attempt and store OTP hash
    await recordRateLimitAttempt(supabase, phone, ip, otp);

    // Send via Fast2SMS
    await sendFast2SMS(phone, otp);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[INTERNAL] Error in send-otp:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
