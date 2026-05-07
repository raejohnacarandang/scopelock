import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const LEMON_SQUEEZY_WEBHOOK_SECRET = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Simple HMAC verification for Lemon Squeezy webhooks
async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(LEMON_SQUEEZY_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const signatureBytes = Uint8Array.from(atob(signature.replace('sha256=', '')), c => c.charCodeAt(0))
    const bodyBytes = encoder.encode(body)
    return await crypto.subtle.verify({ name: 'HMAC', hash: 'SHA-256' }, key, signatureBytes, bodyBytes)
  } catch {
    return false
  }
}

serve(async (req) => {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-signature')
    
    console.log('Lemon Squeezy webhook received')
    
    // Verify webhook signature in production
    if (LEMON_SQUEEZY_WEBHOOK_SECRET && signature) {
      const isValid = await verifyWebhookSignature(body, signature)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    }
    
    const event = JSON.parse(body)
    const eventName = event.meta?.event_name
    
    console.log('Event type:', eventName)
    
    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      // Handle subscription activation
      const userId = event.data?.attributes?.custom_data?.user_id
      const status = event.data?.attributes?.status
      const planId = event.data?.attributes?.variant_id?.toString()
      
      if (userId) {
        // Determine plan from variant ID or use a lookup
        let plan = 'free'
        
        // Map variant IDs to plans
        const VARIANT_MAP: Record<string, string> = {
          '1564885': 'pro',
          '1564886': 'biz',
        }
        
        if (planId && VARIANT_MAP[planId]) {
          plan = VARIANT_MAP[planId]
        }
        
        const subscriptionStatus = status === 'active' ? 'active' : status
        
        // Update user profile
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            plan,
            subscription_status: subscriptionStatus,
            subscription_id: event.data?.id,
            lemon_squeezy_subscription_id: event.data?.id,
            last_payment_date: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (error) {
          console.error('Failed to update plan:', error)
        }
        
        console.log(`User ${userId} updated to ${plan} plan`)
      }
    }
    
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      // Handle subscription cancellation - downgrade to free
      const userId = event.data?.attributes?.custom_data?.user_id
      
      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ 
            plan: 'free',
            subscription_status: 'cancelled',
            lemon_squeezy_subscription_id: null,
          })
          .eq('user_id', userId)
        
        console.log(`User ${userId} downgraded to free plan`)
      }
    }
    
    if (eventName === 'order_created') {
      // Record payment
      const userId = event.data?.attributes?.custom_data?.user_id
      const orderId = event.data?.id
      const total = event.data?.attributes?.total
      
      if (userId && orderId) {
        await supabase
          .from('payments')
          .insert({
            user_id: userId,
            amount: total / 100, // Lemon Squeezy uses cents
            currency: event.data?.attributes?.currency || 'USD',
            lemon_order_id: orderId,
            status: 'paid',
            plan: 'subscription',
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