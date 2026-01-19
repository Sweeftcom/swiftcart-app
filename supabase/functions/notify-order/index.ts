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
    const payload = await req.json()
    const { record, old_record, type } = payload

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Only process status changes
    if (type === 'UPDATE' && record.status === old_record.status) {
      return new Response(JSON.stringify({ message: 'No status change' }), { headers: corsHeaders })
    }

    let targetUserId = record.user_id
    let title = "Order Update"
    let body = `Your order status is now: ${record.status}`

    // Special logic for Vendor/Driver notifications
    if (record.status === 'placed') {
      // Notify Vendor (Conceptual: Find vendor linked to store)
      // targetUserId = vendor_id
      title = "LOUD ALERT: New Order!"
      body = "You have a new order to accept. Ringing..."
    } else if (record.status === 'confirmed' || record.status === 'packing') {
      // Find nearby drivers or notified drivers
      title = "New Delivery Opportunity"
      body = "A new order is ready for pickup. Accept now!"
    }

    // Fetch FCM token
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('fcm_token')
      .eq('user_id', targetUserId)
      .single()

    if (!profile?.fcm_token) {
      return new Response(JSON.stringify({ message: 'No FCM token' }), { headers: corsHeaders })
    }

    const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID')
    const FCM_ACCESS_TOKEN = Deno.env.get('FCM_ACCESS_TOKEN')

    await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FCM_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        message: {
          token: profile.fcm_token,
          notification: { title, body },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'high_importance_channel', // Configured in app to ring continuously
              sound: 'loud_alert',
              sticky: true,
            }
          },
          data: {
            orderId: record.id,
            status: record.status,
            type: 'ORDER_LIFECYCLE'
          }
        },
      }),
    })

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
