# ScopeLock Billing - Deployment Guide (Payhip)

## Prerequisites

1. **Supabase Project** - Create at supabase.com
2. **Payhip Account** - Create at payhip.com
3. **Supabase CLI** - Install: `npm install -g supabase`

---

## Step 1: Setup Payhip Products

1. Go to [Payhip Dashboard](https://payhip.com/dashboard)
2. Create 2 products:

### Pro Plan ($9 - one-time)
- Name: "ScopeLock Pro"
- Price: $9.00
- Copy the product link or ID

### Business Plan ($19 - one-time)
- Name: "ScopeLock Business"
- Price: $19.00
- Copy the product link or ID

---

## Step 2: Update app.html

In `app.html`, update the Payhip product IDs:

```javascript
const PAYHIP_PRODUCTS={pro:"YOUR_PRO_PRODUCT_ID",biz:"YOUR_BIZ_PRODUCT_ID"};
```

Find these in your Payhip product URLs: `payhip.com/b/YOUR_PRODUCT_ID`

---

## Step 3: Set Webhook in Payhip

1. Payhip Dashboard → Settings → Webhooks
2. Add webhook URL: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/payhip-webhook`
3. Events to listen: `subscription.created`, `subscription.deleted`, `paid`, `refunded`

---

## Step 4: Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
cd supabase
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy payhip-webhook
supabase functions deploy billing-history
```

---

## Step 5: Set Environment Variables

In Supabase Dashboard → Settings → Edge Functions:

- `PAHIP_WEBHOOK_SECRET` - Get from Payhip webhook settings

---

## Step 6: Test

1. Open your app
2. Go to **Billing** tab
3. Click **Start Pro** or **Go Business**
4. Should redirect to Payhip checkout
5. Complete payment
6. Should redirect back with success

---

## Files

```
supabase/
├── config.toml
└── functions/
    ├── payhip-webhook/
    │   └── index.ts    # Handles Payhip payments
    └── billing-history/
        └── index.ts    # Gets invoice history
```

---

## Troubleshooting

### Payment not working
- Verify Payhip product IDs are correct
- Check webhook is set in Payhip dashboard
- Check function logs in Supabase Edge Functions

### CORS Errors
- Ensure `verify_jwt: false` in supabase.toml
- Check function logs in Supabase Dashboard