# PayHip Setup Guide

## Why PayHip?
- ✅ PayPal payout (no bank needed for sellers)
- ✅ Easy setup
- ✅ Subscription support
- ✅ Webhooks available

## 1. Create PayHip Account

1. Go to [payhip.com](https://payhip.com)
2. Sign up
3. Connect PayPal for payouts

## 2. Create Products

### Create "Pro" Subscription:
1. Go to **Products → New Product**
2. Choose **Membership**
3. Name: "ScopeLock Pro"
4. Price: $9/month (recurring)
5. Get the product key from URL (e.g., `payhip.com/b/abc123` → key: `abc123`)

### Create "Business" Subscription:
1. Same steps
2. Name: "ScopeLock Business"
3. Price: $19/month

## 3. Update Frontend

In `app.html`, replace the product keys:
```javascript
const PAYHIP_PRODUCTS={pro:"YOUR_PRO_KEY",biz:"YOUR_BIZ_KEY"};
```

And make sure:
```javascript
const PAYMENT_PROVIDER="payhip";
```

## 4. Setup Webhooks

1. Go to **Settings → Webhooks**
2. Add URL: `https://vbsvcduprffogqtvsvoy.supabase.co/functions/v1/payhip-webhook`
3. Select events: `subscription.created`, `subscription.deleted`, `paid`, `refunded`
4. Get the signing secret

## 5. Add Secrets to Supabase

In **Supabase Dashboard → Edge Functions → Secrets**, add:
```
PAHIP_WEBHOOK_SECRET=your_webhook_secret
```

## 6. Deploy Webhook

```bash
supabase functions deploy payhip-webhook
```

## How It Works

1. User clicks upgrade button → redirects to PayHip checkout
2. Custom fields (user_id, plan) passed via URL params
3. User pays on PayHip → webhook received
4. Webhook updates user plan in database

**Note:** No edge function needed for checkout - just direct URL redirect!