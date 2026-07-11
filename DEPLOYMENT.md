# Deploying Nyuzi

The frontend is a static Vite/React SPA; Supabase (database, auth, storage,
edge functions) is already live and hosted separately. This guide covers
deploying the frontend to Vercel and the one-time production config Supabase
needs.

## 1. Deploy the frontend to Vercel

1. Push this repo to GitHub (if not already) and import it in Vercel.
2. Vercel auto-detects the Vite framework preset. Confirm these build
   settings (they match `package.json`):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
3. Add environment variables in Vercel → Project Settings → Environment
   Variables (values are in your local `.env.local`, from Supabase
   Dashboard → Settings → API):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   
   Both are safe to expose to the client — access is controlled by Row
   Level Security, not by keeping the anon key secret.
4. Deploy. `vercel.json` in this repo already rewrites all paths to
   `index.html` so client-side routes (`/marketplace`, `/admin/orders`,
   direct links, page refreshes) resolve correctly instead of 404ing.

## 2. Point Supabase auth at your production domain

Required for password reset and any future email-confirmation flow to work
in production — without this, Supabase rejects the redirect and sends
users back to whatever "Site URL" is currently configured (likely
`localhost`).

In Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL:** your production domain (e.g. `https://nyuzi.vercel.app` or your custom domain)
- **Redirect URLs:** add `https://<your-domain>/reset-password` (and the bare domain)

## 3. Confirm Edge Function secrets are set

Already configured for this project via `supabase secrets set` (values are
never in git — check what's set with `supabase secrets list`):

| Secret | Used by | Status |
|---|---|---|
| `RESEND_API_KEY` | `send-email` | Set (Resend sandbox sender) |
| `EMAIL_WEBHOOK_SECRET` | `send-email` | Set (generated in Supabase Vault, migration 0016) |
| `EMAIL_FROM` | `send-email` | Not set — defaults to `Nyuzi <onboarding@resend.dev>` |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_SHORTCODE` / `MPESA_PASSKEY` / `MPESA_CALLBACK_URL` / `MPESA_ENV` | `mpesa-initiate`, `mpesa-callback` | Not set — checkout automatically falls back to manual-payment mode until these are configured with real Safaricom Daraja credentials |

Before selling to real customers at any volume, verify a domain in Resend
(resend.com/domains) and set `EMAIL_FROM` to an address on that domain —
see `supabase/PHASE_2_EMAIL_SETUP.md`. The sandbox sender only delivers to
your own Resend account email.

## 4. Optional: branded password-reset email

Covered in `supabase/PHASE_2_EMAIL_SETUP.md` step 3 — a one-time Supabase
Dashboard SMTP + email-template setup. Not required for the app to work;
without it, Supabase's default (unstyled) reset email is used.

## 5. Production data hygiene

This project accumulated QA/test data during development (a test admin
account, sample donations/orders/products created by automated tests).
None of it is destructive to leave in place, but consider clearing it
before pointing real users at the site:
- Admin panel → Products / Donations / Orders / Partner Applications — delete anything named "QA", "Test", or similar.
- The test admin account (`nyuzi-testadmin-...@nyuzi-qa-testing.com`) can stay (it's a real Supabase Auth user gated by the same RLS as any other admin) or be removed via Supabase Dashboard → Authentication → Users.

## 6. Post-deploy smoke test

- Sign up, sign out, sign back in.
- Browse the marketplace, add to cart, check out as a guest.
- Submit a donation with a photo.
- Confirm the order-confirmation email arrives (check Admin → Email Log for delivery status).
- Sign in as an admin and confirm the dashboard, products, orders, donations, partners, categories, audit log, and email log pages all load.
