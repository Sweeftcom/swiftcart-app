import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch full order details
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('*, store:stores(*), items:order_items(*), user:profiles(*)')
      .eq('id', orderId)
      .single()

    if (error || !order) throw new Error('Order not found')

    // 2. Generate Invoice Content (Conceptual HTML to PDF or dynamic image)
    // For the pilot, we generate a text-based receipt and store it in Supabase Storage
    const invoiceText = `
      SWEEFTCOM INVOICE
      Order: ${order.order_number}
      Date: ${new Date(order.created_at).toLocaleDateString()}
      Store: ${order.store.name}
      ---------------------------
      Items:
      ${order.items.map((i: any) => `${i.product_name} x ${i.quantity} - ₹${i.price}`).join('\n')}
      ---------------------------
      Total: ₹${order.total}
      Delivery to: ${order.user.name}
    `

    const fileName = `invoices/${order.order_number}.txt`
    await supabaseClient.storage
      .from('documents')
      .upload(fileName, invoiceText, { contentType: 'text/plain', upsert: true })

    const { data: { publicUrl } } = supabaseClient.storage.from('documents').getPublicUrl(fileName)

    return new Response(JSON.stringify({ publicUrl }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
