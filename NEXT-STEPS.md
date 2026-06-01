# KavachAI — Next Steps Roadmap

What to do, in order, to go from "MVP scaffold" to a sellable, scalable product.
💰 = costs money. Everything else is free.

---

## Step 0 — Decide your goal (5 min)
- **Demo / portfolio / pitch?** → Steps 1–3 only, all free. Stop there.
- **Real product for paying customers?** → all steps. Costs money + weeks + legal.

This decision determines how much to invest. Don't skip it.

## Step 1 — Deploy the free demo
Follow `DEPLOY.md` (Neon Postgres + Upstash Redis + Render). Outcome: a public URL
showing the full UI + seeded data. Use it to get feedback from real CA firms /
clinics **before** spending anything.

## Step 2 — Run the full free verification suite
Run everything in `TESTING.md` sections A–C (zero keys needed). Confirms the
scaffold is solid before you show anyone. *(Currently all green.)*

## Step 3 — Validate the core (the make-or-break) 💰 small spend
This is the most important step. Until you do it, you don't know if the product
actually works.
1. Add a real `ANTHROPIC_API_KEY` (a few ₹ of usage).
2. Create a **free** Google OAuth app → connect one Gmail account.
3. Run `npm run worker`, then `npx tsx scripts/simulate-message.ts` — or send a
   real test email with fake PII — and confirm an incident appears with correct
   severity.
4. Measure detection quality: does it catch real violations? How many false
   positives? **This decides whether you have a product.**

## Step 4 — Harden for one pilot customer 💰
- Paid always-on infra (Render free tier sleeps and won't run the worker).
- **Deploy the background worker** as its own always-on service.
- Postgres backups + tested restore; error monitoring (Sentry free tier).
- Security review / basic pentest of auth, webhooks, RBAC.
- Basic DPA + Terms + Privacy reviewed by a lawyer — you process customers'
  private communications, so under the DPDP Act you are a Data Processor.

## Step 5 — Monetization setup 💰
- Razorpay business KYC + GST registration.
- Test the full subscribe → webhook → invoice flow live (start in test mode).
- Finalize pricing.

## Step 6 — First paying pilot → then scale
Land one design-partner customer at a discount, prove value, fix what breaks,
then market for scale.

---

## Cost reality
| Item | Free? |
|---|---|
| Hosting (demo), Postgres, Redis | Free tiers |
| Google / Microsoft / WhatsApp API credentials | **Free to create** |
| Self-generated secrets | Free |
| **Anthropic AI key** | 💰 the only true paid item |
| Always-on worker + scaled infra (for real customers) | 💰 |

The app deploys and runs (UI + demo data) for ₹0. Live AI scanning needs the
one paid key. Real customers need paid infra + legal/security work.
