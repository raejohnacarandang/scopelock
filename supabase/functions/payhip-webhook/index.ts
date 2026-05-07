import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PAYHIP_WEBHOOK_SECRET = Deno.env.get('PAHIP_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  if (!PAYHIP_WEBHOOK_SECRET || !signature) return true
  const expectedSignature = await sha256(PAYHIP_WEBHOOK_SECRET + body)
  return signature === expectedSignature
}

serve(async (req) => {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-payhip-signature')
    
    console.log('Payhip webhook received')
    
    if (!verifyWebhookSignature(body, signature || '')) {
      console.error('Invalid webhook signature')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    
    const event = JSON.parse(body)
    const eventType = event.type
    
    console.log('Event type:', eventType)
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    if (eventType === 'subscription.created' || eventType === 'paid' || eventType === 'order_completed') {
      const userId = event.custom_fields?.user_id
      const planId = event.custom_fields?.plan
      
      if (userId && planId) {
        let plan = 'free'
        
        const PLAN_MAP: Record<string, string> = {
          'price_pro_monthly': 'pro',
          'price_biz_monthly': 'biz',
        }
        
        if (PLAN_MAP[planId]) {
          plan = PLAN_MAP[planId]
        }
        
        const paymentDate = new Date()
        
        // Check lifetime count - first 5 get lifetime, rest get permanent one-time
        const { data: lifetimeUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('is_lifetime', true)
        
        const lifetimeCount = lifetimeUsers?.length || 0
        const MAX_LIFETIME = 5
        const isLifetime = lifetimeCount < MAX_LIFETIME
        
        let expiresAt: string | null
        let paymentType: string
        
        if (isLifetime) {
          // First 5 = lifetime access
          expiresAt = '2099-12-31T23:59:59Z'
          paymentType = 'lifetime'
          console.log(`Lifetime slot available (${lifetimeCount + 1}/${MAX_LIFETIME})`)
        } else {
          // After 5 = one-time permanent (no expiry)
          expiresAt = null
          paymentType = 'one_time'
          console.log(`One-time purchase (lifetime full)`)
        }
        
        // If user was on trial, clear trial status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('trial_status, trial_end_at')
          .eq('user_id', userId)
          .single()
        
        const wasOnTrial = profile?.trial_status === 'active' || profile?.trial_status === 'expired'
        
        await supabase
          .from('user_profiles')
          .update({ 
            plan,
            subscription_status: 'active',
            subscription_id: event.subscription_id || `payhip_${Date.now()}`,
            last_payment_date: paymentDate.toISOString(),
            subscription_expires_at: expiresAt,
            is_lifetime: isLifetime,
            payment_type: paymentType,
            trial_status: wasOnTrial ? 'converted' : 'none',
            trial_started_at: null,
            trial_end_at: null
          })
          .eq('user_id', userId)
        
        console.log(`User ${userId} updated to ${plan} plan (${isLifetime ? 'lifetime' : 'monthly'})`)
        
        await supabase
          .from('payments')
          .insert({
            user_id: userId,
            amount: event.amount || 0,
            currency: event.currency || 'USD',
            payhip_order_id: event.subscription_id || event.id,
            status: 'paid',
            plan: plan,
            created_at: new Date().toISOString()
          })
      }
    }
    
    if (eventType === 'subscription.deleted' || eventType === 'refunded') {
      const userId = event.custom_fields?.user_id
      
      if (userId) {
        const expiresAt = eventType === 'refunded' ? new Date().toISOString() : null
        
        await supabase
          .from('user_profiles')
          .update({ 
            plan: 'free',
            subscription_status: eventType === 'refunded' ? 'refunded' : 'cancelled',
            payhip_subscription_id: null,
            subscription_expires_at: expiresAt,
            is_lifetime: false,
            payment_type: 'none',
            trial_status: 'none',
            trial_started_at: null,
            trial_end_at: null
          })
          .eq('user_id', userId)
        
        console.log(`User ${userId} downgraded to free plan (${eventType})`)
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