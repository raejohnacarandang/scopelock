import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const LEMON_SQUEEZY_API_KEY = Deno.env.get('LEMON_SQUEEZY_API_KEY') || ''
const LEMON_SQUEEZY_STORE_ID = Deno.env.get('LEMON_SQUEEZY_STORE_ID') || ''

// Price mapping - use your Lemon Squeezy variant IDs
const PLANS: Record<string, { variantId: string; name: string }> = {
  'price_pro_monthly': { variantId: '1564885', name: 'Pro Monthly' },
  'price_biz_monthly': { variantId: '1564886', name: 'Business Monthly' },
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { priceId, userId, email } = await req.json()

    if (!priceId || !userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const plan = PLANS[priceId]
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const baseUrl = req.headers.get('origin') || 'https://scopelock-rei.netlify.app'
    
    // Create Lemon Squeezy checkout
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: email,
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url: `${baseUrl}?billing=success`,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: LEMON_SQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: plan.variantId,
              },
            },
          },
        },
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Lemon Squeezy error:', data)
      return new Response(JSON.stringify({ error: 'Checkout creation failed', details: data }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Get checkout URL from response
    const checkoutUrl = data.data?.attributes?.url
    const checkoutId = data.data?.id

    return new Response(JSON.stringify({ 
      url: checkoutUrl,
      checkoutId: checkoutId,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})