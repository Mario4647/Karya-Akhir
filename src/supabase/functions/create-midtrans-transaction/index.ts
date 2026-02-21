import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') || 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU'
const MIDTRANS_API_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { orderId, orderNumber, amount, customerName, customerEmail, customerPhone, items } = await req.json()

    if (!orderNumber || !amount || !customerName || !customerEmail) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transactionData = {
      transaction_details: {
        order_id: `${orderNumber}-${Date.now()}`,
        gross_amount: parseInt(amount)
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: customerPhone || "081234567890"
      },
      item_details: items.map(item => ({
        id: item.id,
        price: parseInt(item.price),
        quantity: parseInt(item.quantity),
        name: item.name
      })),
      callbacks: {
        finish: `${req.headers.origin}/payment-success/${orderId}`,
        error: `${req.headers.origin}/payment/${orderId}`,
        pending: `${req.headers.origin}/payment/${orderId}`
      },
      enabled_payments: [
        "credit_card", "mandiri_clickpay", "bca_klikbca", "bca_klikpay",
        "bri_epay", "echannel", "permata_va", "bca_va", "bni_va",
        "bri_va", "cimb_va", "other_va", "gopay", "shopeepay", "qris"
      ]
    }

    const midtransResponse = await fetch(MIDTRANS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic ' + btoa(MIDTRANS_SERVER_KEY + ':')
      },
      body: JSON.stringify(transactionData)
    })

    const midtransResult = await midtransResponse.json()

    if (!midtransResponse.ok) {
      throw new Error(midtransResult.status_message || 'Failed to create transaction')
    }

    return new Response(
      JSON.stringify({
        success: true,
        snap_token: midtransResult.token,
        transaction_id: midtransResult.transaction_id,
        redirect_url: midtransResult.redirect_url
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
