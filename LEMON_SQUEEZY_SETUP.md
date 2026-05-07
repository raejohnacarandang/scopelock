# Lemon Squeezy Setup Guide

## Why Lemon Squeezy?
- ✅ No TIN required
- ✅ Handles taxes automatically
- ✅ GCash support (via PayPal link)
- ✅ Credit/Debit cards
- ✅ Instant payouts to PayPal or Wise

## 1. Create Lemon Squeezy Account

1. Go to [lemonsqueezy.com](https://lemonsqueezy.com)
2. Sign up with your email (no business docs needed)
3. Verify your email

## 2. Create Your Products

### Create "Pro" Subscription:
1. Go to **Products → New Product**
2. Name: "ScopeLock Pro"
3. Price: $9/month (or ₱500/month)
4. Set as **Subscription**
5. Copy the **Variant ID** from URL (e.g., `12345`)

### Create "Business" Subscription:
1. Same steps
2. Name: "ScopeLock Business"
3. Price: $19/month (or ₱1,000/month)

## 3. Get API Key

1. Go to **Settings → API**
2. Copy your **API Key** (starts with `lemonsqueezy_`)
3. Copy your **Store ID** from URL

## 4. Configure Edge Functions

In your **Supabase Dashboard → Edge Functions → Secrets**, add:

```
LEMON_SQUEEZY_API_KEY=lemonsqueezy_your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

## 5. Update Variant IDs

Edit `supabase/functions/create-checkout-session/index.ts`:

```typescript
const PLANS: Record<string, { variantId: string; name: string }> = {
  'price_pro_monthly': { variantId: 'YOUR_ACTUAL_PRO_VARIANT_ID', name: 'Pro Monthly' },
  'price_biz_monthly': { variantId: 'YOUR_ACTUAL_BIZ_VARIANT_ID', name: 'Business Monthly' },
}
```

## 6. Set Webhook URL

In Lemon Squeezy Dashboard → **Settings → Webhooks**:
```
https://YOUR_PROJECT.supabase.co/functions/v1/lemonsqueezy-webhook
```

Events to enable:
- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `subscription_expired`
- `order_created`

## 7. Update app.html

Replace placeholders in app.html:
```javascript
const LEMON_SQUEEZY_STORE_URL="https://your-store.lemonsqueezy.com";
const API_BASE="https://your-project.supabase.co/functions/v1";
```

## 8. Test Mode

Use test mode in Lemon Squeezy:
- Test card: `4242 4242 4242 4242`
- Any future expiry, any CVC

## How It Works

1. User clicks "Upgrade" in app
2. Redirects to Lemon Squeezy checkout page
3. User pays with GCash/Card/PayPal
4. Lemon Squeezy confirms payment via webhook
5. User is upgraded automatically

## Troubleshooting

### "Checkout creation failed"
- Check your API key is correct
- Verify variant IDs match exactly
- Check store ID is correct

### User not upgraded after payment
- Verify webhook URL is set correctly
- Check webhook is receiving events in Lemon Squeezy dashboard
- Check Supabase logs for webhook errors

### Currency Settings
In Lemon Squeezy product settings, you can set:
- USD for international payments
- PHP (via Wise) for Philippine payments

## Payout Options

### PayPal (Fastest)
1. Connect PayPal in Lemon Squeezy settings
2. Get paid within 24 hours

### Wise (For PH users)
1. Create Wise account
2. Connect via PayPal as intermediary
3. Transfer to GCash from Wise

## Alternative: Buy Me a Coffee

If you want something even simpler for one-time payments:
1. Create a [buymeacoffee.com](https://buymeacoffee.com) page
2. Share the link with users who want to support you
3. No integration needed - just share the link!