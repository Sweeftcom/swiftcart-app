import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Allowed origins for CORS - restrict to your application domains
const ALLOWED_ORIGINS = [
  'https://rlulmjwbrlijeaeukavn.lovableproject.com',
  'https://rlulmjwbrlijeaeukavn.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  
  return headers;
}

interface VerifyRequest {
  phone: string;
  otp: string;
}

// Rate limiting configuration for verification attempts
const MAX_VERIFY_ATTEMPTS = 5; // Max 5 attempts per phone per hour
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour lockout after max attempts

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkVerifyRateLimit(supabase: any, phone: string): Promise<{ allowed: boolean; message?: string }> {
  const windowStart = new Date(Date.now() - LOCKOUT_DURATION_MS).toISOString();
  
  // Check failed verification attempts
  const { count } = await supabase
    .from('otp_verify_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .eq('success', false)
    .gte('created_at', windowStart);
  
  if ((count || 0) >= MAX_VERIFY_ATTEMPTS) {
    return { allowed: false, message: "Too many failed attempts. Please try again in 1 hour." };
  }
  
  return { allowed: true };
}

async function recordVerifyAttempt(supabase: any, phone: string, success: boolean): Promise<void> {
  await supabase
    .from('otp_verify_attempts')
    .insert({
      phone,
      success,
    });
}

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject unauthorized origins
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { phone, otp }: VerifyRequest = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP format (6 digits only)
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check verification rate limit
    const rateLimitResult = await checkVerifyRateLimit(supabase, normalizedPhone);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the OTP from database
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_rate_limits')
      .select('*')
      .eq('phone', normalizedPhone)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      await recordVerifyAttempt(supabase, normalizedPhone, false);
      return new Response(
        JSON.stringify({ error: "OTP expired or not found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP hash
    const providedOtpHash = await hashOtp(otp);
    if (otpRecord.otp_hash !== providedOtpHash) {
      await recordVerifyAttempt(supabase, normalizedPhone, false);
      return new Response(
        JSON.stringify({ error: "Invalid OTP. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - mark as used
    await supabase
      .from('otp_rate_limits')
      .delete()
      .eq('id', otpRecord.id);

    // Record successful verification
    await recordVerifyAttempt(supabase, normalizedPhone, true);

    // Format phone for Supabase (requires E.164 format)
    const formattedPhone = phone.startsWith("+") ? phone : `+91${normalizedPhone}`;

    // Check if user exists by querying profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    let user;

    if (existingProfile) {
      // Get existing user
      const { data: userData } = await supabase.auth.admin.getUserById(existingProfile.user_id);
      user = userData?.user;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true,
        user_metadata: { phone: formattedPhone },
      });

      if (createError) {
        console.error("[INTERNAL] Error creating user");
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      user = newUser.user;
    }

    console.log(`User verified successfully: phone ending in ***${normalizedPhone.slice(-4)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        isNewUser: !existingProfile,
        user: { id: user?.id, phone: formattedPhone },
        message: "Phone verified successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[INTERNAL] Error in verify-otp");
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});