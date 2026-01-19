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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { orderId } = await req.json()
    if (!orderId) {
      throw new Error('Missing orderId')
    }

    // 1. Fetch order details with store and user info
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, store:stores(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message || 'Unknown error'}`)
    }

    // 2. Trigger Driver Search using the RPC we created
    const { data: nearbyDrivers, error: driverError } = await supabaseClient
      .rpc('get_nearby_drivers', {
        p_lat: order.store.lat,
        p_lng: order.store.lng,
        p_radius_km: 5
      })

    if (driverError) {
      console.error('Error finding drivers:', driverError)
    }

    // 3. Create assignments for top 3 nearby drivers
    let assignedCount = 0
    if (nearbyDrivers && nearbyDrivers.length > 0) {
      const assignments = nearbyDrivers.slice(0, 3).map((driver: { id: string }) => ({
        order_id: orderId,
        driver_id: driver.id,
        status: 'offered'
      }))

      const { error: assignError } = await supabaseClient.from('order_assignments').insert(assignments)
      if (!assignError) {
        assignedCount = assignments.length
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Order processed and drivers notified',
        driversFound: nearbyDrivers?.length || 0,
        assignmentsCreated: assignedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
