# KavachAI — Feature Verification Guide

How to check every feature works. Sections A–C need **no API keys**.
Section D is per-integration (needs keys). Section E is pre-launch gates.

> Last full A–C run: **all green** (Next 14.2.35, seeded data).

---

## A. Pre-flight (free, ~5 min)
```bash
cd /Users/spandanmukherjee/Documents/auditapp
npm run type-check     # → 0 errors
npm run lint           # → ✔ No ESLint warnings or errors
npm run build          # → exit 0, ~51 routes
npm run db:seed        # → demo data loaded
npx tsx scripts/smoke-test.ts   # → 14/14 passed
```

## B. Feature UI walkthrough (free, seeded)
`npm run dev`, open http://localhost:3000, log in `admin@mehtaca.com` / `Demo@1234`.
For each page: confirm it loads with data and DevTools → Console stays empty.

| Feature | Test | Pass |
|---|---|---|
| Login / logout | log in, log out | dashboard / back to login |
| Dashboard cards | view top row | score ring, open count, charts |
| Risk-trend chart | hover points | tooltip with counts |
| Incidents table | filters + search | filters live; pagination |
| Incident detail | click a row | entity badges (no PII), risk analysis, actions |
| Incident actions | "Start Investigating" / note | status + timeline update |
| Sources | view cards | WhatsApp/Gmail active; others "Connect" |
| Reports | view list | 2 seeded reports "Ready" |
| Staff | view + search | 5 members |
| Rulebook | severity tabs | 36 rules, grouped, mutable |
| Compliance Score | view breakdown | deductions reconcile to score |
| Settings → General | edit + Save | toast; persists on reload |
| Settings → Billing | view | PROFESSIONAL, 2 sources, 4 users |
| Settings → Team / Notifications | view / toggle | role badges; toggles flip |
| Legal pages | footer links | /privacy /terms /dpa /security render |
| Mobile | DevTools 375px | sidebar → hamburger; no h-scroll |

## C. Security & behavior (free, terminal)
```bash
curl -s -w "\n%{http_code}\n" http://localhost:3000/api/dashboard/stats        # 401
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard        # 307
curl -s -w "\n%{http_code}\n" http://localhost:3000/api/health                  # 200
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' -d '{"email":"bad"}'                       # 400
TOKEN=$(grep META_WEBHOOK_VERIFY_TOKEN .env | cut -d= -f2)
curl -s "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$TOKEN&hub.challenge=ping"  # ping
curl -s -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H 'x-hub-signature-256: sha256=bad' -d '{"object":"x"}'                       # {received:true}, ignored
# No raw PII stored — only entity types:
psql kavachai_db -c 'SELECT "entityTypes" FROM "Incident" LIMIT 3;'
```

## D. Per-integration LIVE checks (after adding each key)
| Integration | Setup | Verify |
|---|---|---|
| AI + worker | real `ANTHROPIC_API_KEY`, `npm run worker` | `npx tsx scripts/simulate-message.ts` → incident appears |
| WhatsApp | Meta app + webhook | send WA msg w/ fake PAN → incident |
| Gmail | Google OAuth app (free) | send email w/ Aadhaar pattern → incident |
| Outlook/Drive/OneDrive | MS/Google app | trigger → incident |
| Razorpay | test keys first | subscribe → checkout → plan updates + invoice row |
| PDF reports | chromium installed | Generate Report → Ready → PDF downloads |
| Email alerts | SMTP creds | CRITICAL incident → alert email arrives |
| Socket.io real-time | socket server + `NEXT_PUBLIC_SOCKET_URL` | new incident → toast, no refresh |

**Core end-to-end test:** with worker running + real key,
`npx tsx scripts/simulate-message.ts` injects a synthetic message through the
full pipeline and prints the created incident. The single best proof the
product works.

## E. Before charging anyone (production gates)
- [ ] Worker deployed always-on (not free tier)
- [ ] Load test: 100s of messages, no queue backup/crash
- [ ] Postgres backups + tested restore
- [ ] Error monitoring wired (Sentry)
- [ ] Security review / pentest of auth, webhooks, RBAC
- [ ] DPA + Terms + Privacy reviewed by a lawyer
- [ ] Detection accuracy measured on real data (acceptable false-positive rate)
