# Tez Development Store

A fast FiveM script store. Next.js, Stripe checkout, automatic downloads after payment. No Tebex needed.

What it does:
- Home page, script list, one page per script (screenshots, video, features, live demo)
- Cart and a secure Stripe checkout
- After payment the buyer lands on an order page with a download button for each script
- Discord "New sale" message and an optional download email
- A discount when someone buys all 3 scripts (change it in `lib/config.ts`)

## IMPORTANT: keep the GitHub repo PRIVATE
The script zips are inside this project (`private/downloads`). If the repo is public, anyone can download your scripts for free.

## 1. Make a Stripe account (free)
1. Go to stripe.com and sign up.
2. Finish "Activate your account" (your ID, your bank account for payouts).
3. In the Stripe dashboard turn on **Test mode** (switch at the top).
4. Open **Developers > API keys** and copy the **Secret key** (`sk_test_...`).

## 2. Try it on your PC (optional)
Needs Node.js 20 or newer from nodejs.org.
```
npm install
copy .env.example .env.local
```
Open `.env.local` and paste your `sk_test_` key. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Then:
```
npm run dev
```
Open http://localhost:3000. Buy a script with the test card `4242 4242 4242 4242`, any future date, any CVC. You should land on the order page and the download should work.

## 3. Put it on the internet with Vercel (free)
1. Create a **private** repo on GitHub and upload this whole folder to it.
2. Go to vercel.com, sign in with GitHub, click **Add New > Project** and pick the repo.
3. Under **Environment Variables** add:
   - `STRIPE_SECRET_KEY` = your Stripe key
   - `NEXT_PUBLIC_SITE_URL` = your site address, for example `https://tez-store.vercel.app` (no slash at the end)
   - `STRIPE_WEBHOOK_SECRET` = fill in at step 4
4. Click **Deploy**.

## 4. Connect Stripe to your site (the webhook)
1. In Stripe go to **Developers > Webhooks > Add endpoint**.
2. Endpoint URL: `https://YOUR-SITE/api/webhook`
3. Pick the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Copy the **Signing secret** (`whsec_...`) and add it in Vercel as `STRIPE_WEBHOOK_SECRET`. Then redeploy.

The webhook only sends the Discord sale message and the email. Downloads work without it.

## 5. Go live
1. In Stripe switch off Test mode and copy the live **Secret key** (`sk_live_...`).
2. In Vercel replace `STRIPE_SECRET_KEY` with it, make a new webhook for live mode and update `STRIPE_WEBHOOK_SECRET`. Redeploy.
3. Make one real small purchase yourself to check it, then refund it in Stripe.

## Optional extras
- Discord sales messages: Discord channel > Edit > Integrations > Webhooks > copy the URL into `DISCORD_SALES_WEBHOOK`.
- Download emails: make a free account on resend.com, verify your domain, add `RESEND_API_KEY` and `EMAIL_FROM`.
- Your own domain: Vercel > Project > Settings > Domains. Then update `NEXT_PUBLIC_SITE_URL`.
- Coupon codes: Stripe > Product catalog > Coupons. Buyers can type them at checkout.

## Change things
- Name, Discord link, support email, text, FAQ, bundle discount: `lib/config.ts`
- Scripts, prices, descriptions, features: `lib/products.ts`
- Accent colour: top of `app/globals.css`
- Logo: replace `public/logo.svg`
- Legal pages: `app/terms`, `app/refunds`, `app/privacy`. They are templates. Read them and edit them to match what you really do.

## Update a script
Replace the zip in `private/downloads/<slug>.zip`, change `version` in `lib/products.ts`, push to GitHub. Vercel redeploys.

## Add a script
1. Add an entry in `lib/products.ts`.
2. Put the zip in `private/downloads/<slug>.zip`.
3. Put screenshots in `public/img/<slug>/` as `.webp` and list their names in `shots`.
4. Put a video and poster in `public/video/`.

## How it is kept fast
Pages are built once and served from the edge. Images are small webp files with fixed sizes, videos only load when played, the demos only load when opened, and the only JavaScript is the cart.

## How downloads are protected
The browser never sends a price. Checkout reads prices from `lib/products.ts`. The download route asks Stripe if the order is paid and includes that script before it sends any file.
