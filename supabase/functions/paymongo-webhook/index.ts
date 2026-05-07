import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    // PayMongo sends POST with payment webhook
    const body = await req.json()
    
    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('paymongo-signature')
    
    // Handle different event types
    const eventType = body.data?.attributes?.status
    
    console.log('PayMongo webhook received:', eventType, body)
    
    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    if (eventType === 'paid') {
      // Payment successful - update user plan
      const metadata = body.data?.attributes?.metadata || {}
      const userId = metadata.userId
      const priceId = metadata.priceId
      
      if (userId && priceId) {
        // Determine plan from priceId
        let plan = 'free'
        if (priceId === 'price_pro_monthly') plan = 'pro'
        if (priceId === 'price_biz_monthly') plan = 'biz'
        
        // Update user profile with new plan
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            plan,
            subscription_status: 'active',
            subscription_id: body.data?.id,
            last_payment_date: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (error) {
          console.error('Failed to update plan:', error)
        }
        
        // Record payment in payments table
        await supabase
          .from('payments')
          .insert({
            user_id: userId,
            amount: body.data?.attributes?.amount / 100, // Convert from cents
            currency: 'PHP',
            paymongo_link_id: body.data?.id,
            status: 'paid',
            plan,
            created_at: new Date().toISOString()
          })
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})