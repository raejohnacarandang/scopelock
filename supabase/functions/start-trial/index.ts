import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const PAYHIP_PRODUCT_URL = Deno.env.get('PAYHIP_PRODUCT_URL') || ''

const TRIAL_DAYS = 14

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { userId } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check if user already has trial or active subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trial_status, plan, subscription_status, is_lifetime')
      .eq('user_id', userId)
      .single()

    if (profile?.is_lifetime || profile?.plan === 'pro' || profile?.plan === 'biz') {
      return new Response(JSON.stringify({ error: 'Already subscribed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (profile?.trial_status === 'active') {
      return new Response(JSON.stringify({ error: 'Trial already active' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (profile?.trial_status === 'converted') {
      return new Response(JSON.stringify({ error: 'Trial already used' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const trialStart = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

    // Start trial - give Pro access
    await supabase
      .from('user_profiles')
      .update({
        trial_started_at: trialStart.toISOString(),
        trial_end_at: trialEnd.toISOString(),
        trial_status: 'active',
        plan: 'pro',
        subscription_status: 'trial'
      })
      .eq('user_id', userId)

    console.log(`Trial started for user ${userId}, ends at ${trialEnd.toISOString()}`)

    // Generate Payhip checkout URL with custom fields
    const checkoutUrl = `${PAYHIP_PRODUCT_URL}?user_id=${userId}&plan=pro`

    return new Response(JSON.stringify({
      success: true,
      trialEnd: trialEnd.toISOString(),
      checkoutUrl: checkoutUrl
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Start trial error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})