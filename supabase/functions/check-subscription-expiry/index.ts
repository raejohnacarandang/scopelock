import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const now = new Date().toISOString()

    console.log('Checking for expired subscriptions...')

    const { data: expiredUsers, error } = await supabase
      .from('user_profiles')
      .select('user_id, plan, subscription_status, subscription_expires_at, email')
      .eq('subscription_status', 'active')
      .neq('is_lifetime', true)
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', now)

    if (error) {
      console.error('Error fetching expired users:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log(`Found ${expiredUsers?.length || 0} expired subscriptions`)

    if (expiredUsers && expiredUsers.length > 0) {
      for (const user of expiredUsers) {
        console.log(`Downgrading user ${user.user_id} (${user.plan})`)

        await supabase
          .from('user_profiles')
          .update({ 
            plan: 'free',
            subscription_status: 'expired',
            subscription_id: null,
            subscription_expires_at: null
          })
          .eq('user_id', user.user_id)

        console.log(`User ${user.user_id} downgraded to free`)
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: expiredUsers?.length || 0
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