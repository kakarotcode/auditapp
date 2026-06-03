# KavachAI — Go-to-Market Starter Kit

Your goal right now is **not** to sell — it's to land **1–3 free design partners**,
prove the AI catches their real violations, and build trust + a case study.
Then you charge.

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
> "Free 30-day pilot. I'll set it up for you, monitor your WhatsApp/email for DPDP
> data-leak risks, and give you a weekly report. No payment, no commitment. In
> return, I'd love 30 minutes of feedback."

Why free: you need their **real data** to prove accuracy and build a case study —
that's worth more than their money right now.

---

## 3. Cold outreach templates

### WhatsApp / short message
> Hi [Name], I've built a tool for Indian CA firms that automatically scans your
> WhatsApp & email for DPDP Act data-leak risks (Aadhaar/PAN shared unsafely, etc.)
> and flags them before they become a ₹-crore problem. I'm running **free** 30-day
> pilots with a few firms. Could I set it up for you this week — 15 min to start?

### Email
> **Subject: Free DPDP risk check for [Firm name]**
>
> Hi [Name],
>
> The DPDP Act lets the Data Protection Board fine firms up to ₹250 crore for
> mishandling personal data — and most data leaks at CA firms happen quietly over
> WhatsApp and email (a PAN here, an Aadhaar scan there).
>
> I've built **KavachAI** — it connects to your inboxes, uses AI to flag risky
> sharing in real time, and produces audit-ready reports. I'm offering a **free
> 30-day pilot** to a few firms in exchange for feedback.
>
> Could we do a quick 15-minute setup this week?
>
> Best, [You] · [phone] · kavachai.in

---

## 4. The 30-second pitch (for in person / calls)
> "You know how your team shares client PANs and Aadhaar over WhatsApp all day?
> Under the new DPDP Act that's a finable offence — up to ₹250 crore. KavachAI
> watches your channels with AI and flags those leaks instantly, plus gives you
> an audit-ready report if the Data Protection Board ever asks. Think of it as a
> smoke detector for client data. Want to try it free for a month?"

---

## 5. What to do DURING the pilot (this is the real product test)
1. Connect their Gmail (or have them paste real messages into the Scan page).
2. **Measure accuracy on their real data** (use `scripts/eval-detection.ts` as a
   template — add their real examples).
3. Track: did it catch the real risks? How many **false alarms**? Ask them.
4. Fix prompts/rules based on misses. Re-test.
5. Give them a weekly report. Get a quote/testimonial.

**Success = they say "this caught something we'd have missed" AND false alarms are low.**
That's your proof you can charge.

---

## 6. Only AFTER a successful pilot → turn on billing
- Razorpay **KYC** + **GST** (required for real money).
- Lawyer-reviewed **DPA + Terms + Privacy**.
- Paid infra + always-on worker (24/7 monitoring).
- Convert the pilot to a paid plan; ask for a referral.

---

## 7. Pricing (already built in)
- **Starter** ₹2,999/mo · **Professional** ₹6,999/mo · **Guardian** ₹12,999/mo
- For the first 2–3 customers, offer **50% off for 6 months** as "founding members."

---

### Reality check
A compliance product lives or dies on **trust + accuracy**. One firm that says
"KavachAI caught a real leak for us" unlocks the next ten. Spend your energy
there — not on more features.
