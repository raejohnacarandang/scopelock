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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')

    // If no userId, return empty invoices
    if (!userId) {
      return new Response(JSON.stringify({ invoices: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Use service role key to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check if payments table exists
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist or error, return empty
      console.log('Payments error:', error.message)
      return new Response(JSON.stringify({ invoices: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const invoices = (payments || []).map(p => ({
      id: p.payhip_order_id || p.id,
      amount: p.amount,
      currency: p.currency,
      date: p.created_at,
      plan: p.plan,
      status: p.status,
    }))

    return new Response(JSON.stringify({ invoices }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ invoices: [], error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})