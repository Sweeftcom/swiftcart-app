import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  phone: string;
}

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendFast2SMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = Deno.env.get("FAST2SMS_API_KEY");

  if (!apiKey) {
    console.error("Fast2SMS API key not configured");
    throw new Error("SMS service not configured");
  }

  // Normalize phone number (remove +91 or any prefix, keep last 10 digits)
  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  const url = "https://www.fast2sms.com/dev/bulkV2";
  
  const params = new URLSearchParams({
    authorization: apiKey,
    route: "otp",
    variables_values: otp,
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
    console.error("Fast2SMS API error:", data);
    throw new Error(data.message || "Failed to send SMS");
  }

  console.log("SMS sent successfully:", data.request_id);
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

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
    otpStore.set(normalizedPhone, { otp, expiresAt });

    // Send via Fast2SMS
    await sendFast2SMS(phone, otp);

    console.log(`OTP sent to ${phone}: ${otp}`); // Remove in production

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Export for verify endpoint
export { otpStore };
