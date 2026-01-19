import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { lat, lng, orderCount, riderCount } = await req.json()

    let surgeMultiplier = 1.0
    let reasons = []

    // 1. Late Night Surge (11 PM - 4 AM)
    const hour = new Date().getHours()
    if (hour >= 23 || hour <= 4) {
      surgeMultiplier += 0.5
      reasons.push("Late Night")
    }

    // 2. High Demand Surge
    if (orderCount > riderCount * 2) {
      surgeMultiplier += 0.8
      reasons.push("High Demand")
    }

    // 3. Weather Surge (Conceptual: Would fetch from OpenWeatherMap)
    // const weather = await fetchWeather(lat, lng)
    // if (weather === 'Rain') surgeMultiplier += 1.0

    return new Response(
      JSON.stringify({
        surgeMultiplier: parseFloat(surgeMultiplier.toFixed(1)),
        reasons
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
