import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, body, data } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('fcm_token')
      .eq('user_id', userId)
      .single()

    if (!profile?.fcm_token) {
      return new Response(JSON.stringify({ error: 'FCM token not found' }), { status: 404 })
    }

    // PRO TIP: Using FCM HTTP v1 (Simplified for logic)
    // Production requires Google OAuth2 token from Service Account JSON
    const GOOGLE_ACCESS_TOKEN = Deno.env.get('FCM_ACCESS_TOKEN'); // Set this via CLI
    const PROJECT_ID = Deno.env.get('FCM_PROJECT_ID');

    const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOOGLE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        message: {
          token: profile.fcm_token,
          notification: { title, body },
          data: {
            ...data,
            persistent: 'true',
            sound: 'loud_alert.mp3',
          },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'high_importance_channel',
              sound: 'loud_alert',
              click_action: 'TOP_LEVEL_NAVIGATOR',
            },
          },
        },
      }),
    })

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
