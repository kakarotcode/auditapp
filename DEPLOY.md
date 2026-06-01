# Deploying KavachAI for free (Render + Neon + Upstash)

This deploys the web app to the internet at **₹0** using free tiers. It runs the
full UI with your demo data. Live message scanning (worker + AI + integrations)
is added later when you have API keys — see the last section.

> **Architecture note:** Render's free tier runs the web service but not a
> background worker. Without integration keys the worker has nothing to do, so
> we deploy web-only now. The web service also **sleeps after ~15 min idle** on
> the free tier and wakes on the next request (first hit takes ~30s).

---

## Step 1 — Free Postgres (Neon) · 5 min
1. Sign up at https://neon.tech (free, no card).
2. Create a project → copy the **connection string** (the "pooled" one).
3. Make sure it ends with `?sslmode=require`. Save it as `DATABASE_URL`.

## Step 2 — Free Redis (Upstash) · 3 min
1. Sign up at https://upstash.com (free, no card).
2. Create a Redis database (region: closest to Singapore/India).
3. Copy the **`rediss://...` URL**. Save it as `REDIS_URL`.

## Step 3 — Generate secrets · 1 min
Run locally in a terminal:
```bash
openssl rand -base64 48      # → NEXTAUTH_SECRET
openssl rand -hex 32         # → TOKEN_ENCRYPTION_KEY  (must be 64 hex chars)
```

## Step 4 — Push the repo to GitHub · 5 min
```bash
cd /Users/spandanmukherjee/Documents/auditapp
git init && git add -A && git commit -m "KavachAI"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/kavachai.git
git branch -M main && git push -u origin main
```
(`.env` is git-ignored, so your local secrets won't be pushed — good.)

## Step 5 — Deploy on Render · 10 min
1. Sign up at https://render.com (free, no card).
2. **New → Blueprint** → connect your GitHub repo. Render reads `render.yaml`.
3. It will prompt for the `sync:false` env vars. Paste:
   - `DATABASE_URL` (from Neon)
   - `REDIS_URL` (from Upstash)
   - `NEXTAUTH_SECRET` (generated)
   - `TOKEN_ENCRYPTION_KEY` (generated)
   - `META_WEBHOOK_VERIFY_TOKEN` → any random string
   - `ANTHROPIC_API_KEY` → `placeholder-add-real-key-later` (any non-empty string)
   - `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` → leave blank for now, set in step 6.
4. Click **Apply**. The build runs `prisma migrate deploy` automatically, then builds Next.js.

## Step 6 — Set your URL · 2 min
1. After the first deploy, Render gives you a URL like `https://kavachai-web.onrender.com`.
2. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to that URL in the Render dashboard → **Save** (triggers a redeploy).

## Step 7 — Seed the production database · 2 min
Run locally, pointed at your Neon DB, to load the demo org/incidents:
```bash
cd /Users/spandanmukherjee/Documents/auditapp
DATABASE_URL="<your-neon-connection-string>" npm run db:seed
```

## Step 8 — Log in 🎉
Open your Render URL and log in:
- **admin@mehtaca.com** / **Demo@1234**

You should see the populated dashboard.

> **If the dashboard looks empty (score 100, 0 incidents):** you logged in before
> seeding, or re-seeded after logging in — the session is stale. Just **log out
> and back in**. (The app now auto-signs-out stale sessions, so a refresh fixes it.)

---

## Going live later (when you have keys — all free to create)
- **Real login + Gmail/Drive:** create OAuth credentials in Google Cloud Console (free) → set `GOOGLE_CLIENT_ID/SECRET`.
- **WhatsApp:** Meta Cloud API (1,000 free conversations/mo) → set the `META_*` vars.
- **AI classification:** add a real `ANTHROPIC_API_KEY` (this is the one paid item).
- **The background worker:** in Render, add a **Background Worker** service (paid) with start command `npm run worker`, OR run the worker on a free always-on host / your own machine. It connects to the same Neon + Upstash.
- **PDF storage:** AWS S3 (free 12 mo) or Cloudflare R2 (free) → set `AWS_*`.
- **Email alerts:** Gmail SMTP or Brevo (free) → set `SMTP_*`.

Add each key, redeploy, and that feature switches on. No code changes needed.
