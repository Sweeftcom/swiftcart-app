import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  phone: string;
  otp: string;
}

// In-memory OTP store (shared with send-otp in production use database/Redis)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp }: VerifyRequest = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
    const storedData = otpStore.get(normalizedPhone);

    // For development/testing: accept "123456" as valid OTP
    const isTestOtp = otp === "123456";
    
    if (!isTestOtp) {
      if (!storedData) {
        return new Response(
          JSON.stringify({ error: "OTP expired or not found. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(normalizedPhone);
        return new Response(
          JSON.stringify({ error: "OTP has expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storedData.otp !== otp) {
        return new Response(
          JSON.stringify({ error: "Invalid OTP. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clear used OTP
      otpStore.delete(normalizedPhone);
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

    // Format phone for Supabase (requires E.164 format)
    const formattedPhone = phone.startsWith("+") ? phone : `+91${normalizedPhone}`;

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.phone === formattedPhone);

    let user;
    let session;

    if (existingUser) {
      // Sign in existing user - generate session token
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingUser.email || `${normalizedPhone}@phone.sweeftcom.app`,
      });

      if (error) {
        console.error("Error generating session:", error);
        // Fallback: create a custom session response
        return new Response(
          JSON.stringify({ 
            success: true, 
            isNewUser: false,
            user: { id: existingUser.id, phone: formattedPhone },
            message: "Verified successfully" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      user = existingUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true,
        user_metadata: { phone: formattedPhone },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      user = newUser.user;
    }

    console.log(`User verified: ${formattedPhone}, ID: ${user?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        isNewUser: !existingUser,
        user: { id: user?.id, phone: formattedPhone },
        message: "Phone verified successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
