import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check for errors in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { count, error } = await supabaseClient
      .from('app_errors')
      .select('*', { count: 'exact', head: true })
      .eq('error_type', 'PLACE_ORDER_ATOMIC_FAILURE')
      .gte('created_at', fiveMinutesAgo)

    if (error) throw error

    // 2. Trigger SOS if failure threshold (3) is exceeded
    if (count && count >= 3) {
      const adminUserId = Deno.env.get('ADMIN_USER_ID') // The CTOO's ID

      // Call our existing notify-user function for the SOS Push
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          userId: adminUserId,
          title: "🚨 SOS: CRITICAL SYSTEM ERROR",
          body: `Order system has failed ${count} times in the last 5 mins. Investigate immediately.`,
          data: { priority: 'SOS', type: 'SYSTEM_CRITICAL' }
        })
      })
    }

    return new Response(JSON.stringify({ checked: true, errorCount: count || 0 }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
