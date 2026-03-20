import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

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

    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const email = url.searchParams.get('email')

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email', invoices: [] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Find customer by email
    const customers = await stripe.customers.list({ 
      email, 
      limit: 1 
    })

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const customerId = customers.data[0].id

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 12,
    })

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.number || `INV-${invoice.id}`,
      date: new Date(invoice.created * 1000).toISOString().split('T')[0],
      amount: (invoice.total / 100),
      status: invoice.status || 'paid',
      plan: invoice.lines.data[0]?.description || 'Subscription',
      pdf: invoice.invoice_pdf,
    }))

    return new Response(JSON.stringify({ invoices: formattedInvoices }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, invoices: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
