# PayMongo Setup Guide

## 1. Create PayMongo Account
1. Go to [paymongo.com](https://paymongo.com)
2. Sign up for a merchant account
3. Verify your business/solo-preneur account

## 2. Get API Keys
1. Log in to PayMongo Dashboard
2. Go to **Developers > API Keys**
3. Copy your:
   - **Public Key** (pk_test_xxx) → for frontend
   - **Secret Key** (sk_test_xxx) → for edge functions

## 3. Configure Edge Functions

### Create-checkout-session function
In your Supabase dashboard, set these secrets:
```
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
```

### PayMongo Webhook function
Set webhook URL in PayMongo Dashboard:
```
https://YOUR_PROJECT.supabase.co/functions/v1/paymongo-webhook
```

## 4. Update app.html
Replace placeholder values in app.html:
```javascript
const PAYMONGO_PUBLIC_KEY="pk_test_xxxxx"; // Your PayMongo public key
const API_BASE="https://your-project.supabase.co/functions/v1"; // Your Supabase URL
```

## 5. Run Database Migration
Execute `supabase/migrations/20240101_payments_table.sql` in your Supabase SQL editor.

## 6. Test Payments
1. Use PayMongo test mode (test keys start with `pk_test_`)
2. Test card: `4242 4242 4242 4242` (any future date, any CVC)
3. Test GCash: Use PayMongo test GCash number

## Supported Payment Methods
- ✅ Credit/Debit Cards (Visa, Mastercard)
- ✅ GCash
- ✅ GrabPay
- ✅ Bank transfers (BDO, BPI, UnionBank)

## Pricing (in PHP)
- **Pro**: ₱900/month
- **Business**: ₱1,900/month

## Important Notes
1. PayMongo uses **PHP** currency
2. Amounts are in **cents** (900 = ₱9.00)
3. Webhook confirms payment and upgrades user plan
4. Users are upgraded immediately after payment confirmation