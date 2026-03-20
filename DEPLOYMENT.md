# ScopeLock Billing - Deployment Guide

## Prerequisites

1. **Supabase Project** - Create at supabase.com
2. **Stripe Account** - Create at stripe.com
3. **Supabase CLI** - Install: `npm install -g supabase`

---

## Step 1: Setup Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create your account (or sign in)
3. Go to **Developers → API Keys**
4. Copy your **Secret Key** (starts with `sk_test_`)

---

## Step 2: Create Stripe Products

1. Go to **Products** in Stripe Dashboard
2. Create 2 products:

### Pro Plan ($9/month)
- Name: "ScopeLock Pro"
- Price: $9.00/month (recurring)
- Copy the **Price ID** (starts with `price_`)

### Business Plan ($19/month)
- Name: "ScopeLock Business"  
- Price: $19.00/month (recurring)
- Copy the **Price ID**

---

## Step 3: Set Environment Variables

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → Edge Functions**
4. Add new secret:
   - Key: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (sk_test_xxx)

---

## Step 4: Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
cd supabase
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session  
supabase functions deploy billing-history
```

To get your project ref: Supabase Dashboard → Settings → General → Project Ref

---

## Step 5: Update app.html

In `app.html`, find line ~3791 and replace `YOUR_PROJECT` with your actual Supabase project ref:

```javascript
const API_BASE="https://abc123.supabase.co/functions/v1";
```

Get your URL from: Supabase Dashboard → Settings → API → Project URL

---

## Step 6: Test

1. Open your app
2. Go to **Billing** tab
3. Click **Switch to Pro** or **Switch to Business**
4. Should redirect to Stripe Checkout
5. Complete payment
6. Should redirect back with success

---

## Troubleshooting

### CORS Errors
- Ensure functions have `verify_jwt: false` in config
- Check function logs in Supabase Dashboard → Edge Functions

### Stripe Errors
- Verify STRIPE_SECRET_KEY is set correctly
- Check Price IDs match your Stripe products

### Payment Not Working
- Use Stripe test cards:
  - Success: 4242 4242 4242 4242
  - Decline: 4000 0000 0000 0002

---

## Files Created

```
supabase/
├── config.toml                    # Edge function config
└── functions/
    ├── create-checkout-session/
    │   └── index.ts              # Creates Stripe checkout
    ├── create-portal-session/
    │   └── index.ts              # Opens billing portal
    └── billing-history/
        └── index.ts               # Gets invoice history
```

---

## Production Notes

1. **Enable JWT verification** in production (update config)
2. **Set up webhook** for subscription events
3. **Store customer IDs** in your database
4. **Add webhook signature verification**
5. Use Stripe **live keys** (sk_live_xxx) in production
