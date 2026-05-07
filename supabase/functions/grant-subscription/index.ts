import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const INTERNAL_API_KEY = Deno.env.get('INTERNAL_API_KEY') || ''

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== INTERNAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    const { user_id, plan, is_lifetime } = await req.json()
    
    if (!user_id || !plan) {
      return new Response(JSON.stringify({ error: 'user_id and plan are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log(`Granting ${is_lifetime ? 'lifetime' : ''} ${plan} plan to user ${user_id}`)

    const updateData: any = {
      plan,
      subscription_status: is_lifetime ? 'active' : 'active',
    }

    if (is_lifetime) {
      updateData.is_lifetime = true
      updateData.subscription_expires_at = '2099-12-31T23:59:59Z'
    }

    await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user_id)

    return new Response(JSON.stringify({ 
      success: true,
      user_id,
      plan,
      is_lifetime: is_lifetime || false
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})