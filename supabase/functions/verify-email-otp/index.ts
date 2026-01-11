import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Allowed origins for CORS
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
  email: string;
  otp: string;
}

// Rate limiting for verification attempts
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_WINDOW_MINUTES = 15;

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkVerifyRateLimit(supabase: any, email: string): Promise<{ allowed: boolean; message?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const windowStart = new Date(Date.now() - VERIFY_WINDOW_MINUTES * 60 * 1000).toISOString();
  
  // Count recent failed verification attempts
  const { count } = await supabase
    .from('email_otp_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .gte('created_at', windowStart);
  
  if ((count || 0) >= MAX_VERIFY_ATTEMPTS) {
    return { 
      allowed: false, 
      message: "Too many verification attempts. Please request a new code." 
    };
  }
  
  return { allowed: true };
}

async function verifyOtp(supabase: any, email: string, otp: string): Promise<{ valid: boolean; isNewUser?: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  const otpHash = await hashOtp(otp);
  
  // Find valid OTP record
  const { data: otpRecords, error } = await supabase
    .from('email_otp_rate_limits')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('otp_hash', otpHash)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error || !otpRecords || otpRecords.length === 0) {
    return { valid: false };
  }
  
  // OTP is valid - delete all OTPs for this email
  await supabase
    .from('email_otp_rate_limits')
    .delete()
    .eq('email', normalizedEmail);
  
  // Check if user exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('email', normalizedEmail)
    .maybeSingle();
  
  return { 
    valid: true, 
    isNewUser: !existingProfile?.name 
  };
}

async function createOrGetUser(supabaseAdmin: any, email: string): Promise<{ user: any; session: any; isNewUser: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Try to get existing user
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u: any) => u.email === normalizedEmail);
  
  if (existingUser) {
    // Generate magic link session for existing user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    });
    
    if (error) {
      throw new Error("Failed to create session");
    }
    
    // Create session using the token
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    }).catch(() => ({ data: null, error: null }));
    
    // Get fresh session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password: 'temp-password-not-used',
    }).catch(() => ({ data: null, error: null }));
    
    // Use admin API to create a session
    return { user: existingUser, session: null, isNewUser: false };
  } else {
    // Create new user with auto-confirmed email
    const tempPassword = crypto.randomUUID();
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      password: tempPassword,
    });
    
    if (createError) {
      throw new Error("Failed to create account");
    }
    
    return { user: newUser.user, session: null, isNewUser: true };
  }
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
    const { email, otp }: VerifyRequest = await req.json();

    // Validate inputs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check rate limit for verification attempts
    const rateLimitResult = await checkVerifyRateLimit(supabase, email);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP
    const verifyResult = await verifyOtp(supabase, email, otp);
    
    if (!verifyResult.valid) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP verified - create or get user and generate magic link
    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate a magic link for the user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: `${origin}/location`,
      },
    });
    
    if (linkError) {
      console.error("[INTERNAL] Magic link error:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the token hash and type for client to use
    const tokenHash = linkData.properties?.hashed_token;
    const emailOtpType = 'magiclink';
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        isNewUser: verifyResult.isNewUser,
        // Include verification data for client
        verification: {
          type: emailOtpType,
          token_hash: tokenHash,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[INTERNAL] Error in verify-email-otp:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});