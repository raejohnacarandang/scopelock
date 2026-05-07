import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const now = new Date().toISOString()

    // Find all users with expired trials
    const { data: expiredTrials } = await supabase
      .from('user_profiles')
      .select('user_id, trial_end_at')
      .eq('trial_status', 'active')
      .lt('trial_end_at', now)

    if (expiredTrials && expiredTrials.length > 0) {
      console.log(`Found ${expiredTrials.length} expired trials`)

      for (const trial of expiredTrials) {
        // Downgrade to free
        await supabase
          .from('user_profiles')
          .update({
            plan: 'free',
            subscription_status: 'expired',
            trial_status: 'expired'
          })
          .eq('user_id', trial.user_id)

        console.log(`Trial expired for user ${trial.user_id}`)
      }
    }

    return new Response(JSON.stringify({
      expired: expiredTrials?.length || 0
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Check trial expiry error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})