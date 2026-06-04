# KavachAI — Go-to-Market Starter Kit

Your goal right now is **not** to sell — it's to land **1–3 free design partners**,
prove the AI catches their real violations, and build trust + a case study.
Then you charge.

> **What's live today (be accurate in demos):**
> - ✅ **Manual AI Scan** — paste any message, AI flags DPDP violations instantly. *(This is your live demo.)*
> - ✅ Dashboard, incidents + AI remediation, audit-ready **PDF reports**, login (email + Google).
> - 🔧 **Auto-scan of Gmail** — built; enabled per pilot via a Google "test user" (no public verification needed yet).
> - 🔧 **Auto-scan of WhatsApp / 24-7 monitoring** — built; switched on with a Meta Business account + the always-on worker (paid).
>
> So: **demo the manual Scan** (flawless today); position auto-monitoring as
> *"what we switch on for you during the pilot."*

---

## 1. Who to approach first (your ideal first customer)
Pick people you can reach in person / via a warm intro:
- **CA firms** (5–30 staff) — they handle PAN, Aadhaar, bank data daily on WhatsApp/email.
- **Private clinics / diagnostic labs** — patient health data.
- **Small NBFCs / loan agents** — KYC + financial data.

Start with **CA firms** — highest pain, you already model that vertical, and they
understand penalties.

**Target: a firm where you know someone.** One warm intro beats 100 cold emails.

---

## 2. The offer (make it a no-brainer)
> "Free 30-day pilot. I'll set it up for you, scan your communications for DPDP
> data-leak risks, and give you a weekly report. No payment, no commitment. In
> return, I'd love 30 minutes of feedback."

Why free: you need their **real data** to prove accuracy and build a case study —
that's worth more than their money right now.

---

## 3. Cold outreach templates
*(Honest framing: "AI that flags DPDP risks in your messages." True today via Scan;
auto-monitoring is enabled during the pilot.)*

### WhatsApp / short message
> Hi [Name], I've built an AI tool for Indian CA firms that flags DPDP Act
> data-leak risks in your messages (Aadhaar/PAN shared unsafely, etc.) before they
> become a ₹-crore problem. I'm running **free** 30-day pilots with a few firms.
> Could I show you in 15 min this week?

### Email
> **Subject: Free DPDP risk check for [Firm name]**
>
> Hi [Name],
>
> The DPDP Act lets the Data Protection Board fine firms up to ₹250 crore for
> mishandling personal data — and most leaks at CA firms happen quietly over
> WhatsApp and email (a PAN here, an Aadhaar scan there).
>
> I've built **KavachAI** — it uses AI to flag risky data sharing and produces
> audit-ready reports. I'm offering a **free 30-day pilot** to a few firms in
> exchange for feedback.
>
> Could we do a quick 15-minute demo this week?
>
> Best, [You] · [phone] · kavachai.in

---

## 4. The 30-second pitch (for in person / calls)
> "You know how your team shares client PANs and Aadhaar over WhatsApp all day?
> Under the new DPDP Act that's a finable offence — up to ₹250 crore. KavachAI
> uses AI to flag those leaks and gives you an audit-ready report if the Data
> Protection Board ever asks. Think of it as a smoke detector for client data.
> Want to try it free for a month?"

---

## 5. The LIVE demo (what to actually click — works today)
Open https://kavachai-web.onrender.com (logged in) and run this 5-minute flow:

1. **Scan a Message** → paste:
   *"Sharing client Ramesh's Aadhaar 4321 8765 9012 and PAN ABCDE1234F with our external vendor."*
   → **Scan with AI** → it flags **CRITICAL**, cites DPDP Section 7(b), lists fix-it
   steps, and stores only data *types* (no real numbers). **← this is the wow moment.**
2. **Dashboard** → compliance score, open incidents, trend chart.
3. **Incident detail** → AI remediation checklist + risk explanation → **Resolve** it
   (score improves).
4. **Reports** → open one → **Save as PDF** (audit-ready, one click).

⚠️ In a live demo, **don't** click "Scan my Gmail inbox" yet (paused pending Google
verification) — the manual Scan proves the identical AI.

---

## 6. What to do DURING the pilot
1. Start with the **manual Scan** on a batch of their real (or realistic) messages —
   zero setup, instant proof.
2. **Measure accuracy** with `scripts/eval-detection.ts` (add their real examples to
   the CASES array). Track catches vs **false alarms**.
3. **Enable a real channel** for them:
   - **Gmail:** add their email as a Google "test user" → turn Gmail auto-scan back on (no public verification needed for ≤100 testers).
   - **WhatsApp / 24-7:** create the free Meta Business API account + run the worker (needs the paid Render plan).
4. Fix prompts/rules based on misses → re-test → give them a weekly report → get a quote/testimonial.

**Success = they say "this caught something we'd have missed" AND false alarms are low.**
That's your proof you can charge.

---

## 7. Only AFTER a successful pilot → turn on billing
- Razorpay **KYC** + **GST** (required for real money).
- Lawyer-reviewed **DPA + Terms + Privacy**.
- Paid infra + always-on worker (24/7 monitoring).
- **Google verification** for the Gmail restricted scope (public Gmail auto-scan).
- Convert the pilot to a paid plan; ask for a referral.

---

## 8. Pricing (already built in)
- **Starter** ₹2,999/mo · **Professional** ₹6,999/mo · **Guardian** ₹12,999/mo
- For the first 2–3 customers, offer **50% off for 6 months** as "founding members."

---

### Reality check
A compliance product lives or dies on **trust + accuracy**. One firm that says
"KavachAI caught a real leak for us" unlocks the next ten. Lead with the live
manual Scan, prove accuracy on real data, then switch on the channels. Spend your
energy there — not on more features.
