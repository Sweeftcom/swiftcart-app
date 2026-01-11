import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface OtpRequest {
  email: string;
}

// Rate limiting configuration
const RATE_LIMIT_PER_EMAIL = 3; // Max 3 OTPs per email per hour
const RATE_LIMIT_PER_IP = 10; // Max 10 OTPs per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 16));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkRateLimit(supabase: any, email: string, ip: string): Promise<{ allowed: boolean; message?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Check email rate limit
  const { count: emailCount } = await supabase
    .from('email_otp_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .gte('created_at', windowStart);
  
  if ((emailCount || 0) >= RATE_LIMIT_PER_EMAIL) {
    return { allowed: false, message: "Too many OTP requests for this email. Please try again later." };
  }
  
  // Check IP rate limit
  const { count: ipCount } = await supabase
    .from('email_otp_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', windowStart);
  
  if ((ipCount || 0) >= RATE_LIMIT_PER_IP) {
    return { allowed: false, message: "Too many OTP requests from this location. Please try again later." };
  }
  
  return { allowed: true };
}

async function recordOtpAttempt(supabase: any, email: string, ip: string, otp: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  
  await supabase
    .from('email_otp_rate_limits')
    .insert({
      email: normalizedEmail,
      ip_address: ip,
      otp_hash: await hashOtp(otp),
      expires_at: expiresAt
    });
}

async function sendEmailWithResend(email: string, otp: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("[INTERNAL] Resend API key not configured");
    throw new Error("Email service not configured. Please contact support.");
  }
  
  const resend = new Resend(resendApiKey);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your SweeftCom Login Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
                  <div style="width: 56px; height: 56px; background-color: rgba(255,255,255,0.2); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <span style="font-size: 28px;">⚡</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">SweeftCom</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Delivery in minutes</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px;">
                  <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">Your Login Code</h2>
                  <p style="color: #71717a; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    Enter this code to sign in to your SweeftCom account. It expires in ${OTP_EXPIRY_MINUTES} minutes.
                  </p>
                  
                  <!-- OTP Code Box -->
                  <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                      ${otp}
                    </div>
                  </div>
                  
                  <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
                    If you didn't request this code, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e4e4e7;">
                  <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                    © ${new Date().getFullYear()} SweeftCom. All rights reserved.<br>
                    Aurangabad, Maharashtra, India
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  const textContent = `
Your SweeftCom Login Code

Enter this code to sign in: ${otp}

This code expires in ${OTP_EXPIRY_MINUTES} minutes.

If you didn't request this code, you can safely ignore this email.

© ${new Date().getFullYear()} SweeftCom
  `.trim();
  
  try {
    const { data, error } = await resend.emails.send({
      from: "SweeftCom <onboarding@resend.dev>", // Using Resend's test domain
      to: [email],
      subject: `Your SweeftCom login code: ${otp}`,
      html: htmlContent,
      text: textContent,
    });
    
    if (error) {
      console.error("[INTERNAL] Resend error:", error);
      throw new Error("Failed to send email. Please try again.");
    }
    
    console.log(`OTP email sent successfully to: ${email.slice(0, 3)}***@${email.split('@')[1]}`);
    return true;
  } catch (err: any) {
    console.error("[INTERNAL] Email send error:", err.message);
    throw new Error("Failed to send email. Please try again.");
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
    const { email }: OtpRequest = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
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
    const rateLimitResult = await checkRateLimit(supabase, email, ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOtp();

    // Record OTP attempt
    await recordOtpAttempt(supabase, email, ip, otp);

    // Send email via Resend
    await sendEmailWithResend(email, otp);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to your email" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[INTERNAL] Error in send-email-otp:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});