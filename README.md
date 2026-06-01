# KavachAI — DPDP Compliance Intelligence Platform

KavachAI is a B2B SaaS compliance monitoring platform that connects to WhatsApp Business, Gmail, Outlook, Google Drive, and OneDrive, scans all communications in real time using AI, detects India DPDP Act 2023 violations, scores risk, fires instant alerts, and generates audit-ready PDF reports for the Data Protection Board of India (DPB).

## Quick Start (Demo)

```bash
# 1. Clone and install
git clone <repo>
cd auditapp
npm install

# 2. Start infrastructure
docker compose up postgres redis -d

# 3. Set environment variables
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, NEXTAUTH_SECRET (any random string for dev)

# 4. Run database migrations and seed
npx prisma migrate dev
npx prisma db seed

# 5. Start the app
npm run dev
```

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mehtaca.com | Demo@1234 |
| Compliance Officer | compliance@mehtaca.com | Demo@1234 |
| Auditor | auditor@mehtaca.com | Demo@1234 |
| Staff | staff@mehtaca.com | Demo@1234 |

Open [http://localhost:3000](http://localhost:3000) and log in as admin.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Next.js 14 App (port 3000)                         │
│  Auth · API routes · Dashboard UI                   │
└─────────────────┬───────────────────────────────────┘
                  │ Redis pub/sub
┌─────────────────▼───────────────────────────────────┐
│  BullMQ Workers (separate process)                  │
│  message-processor · alert-sender · report-gen      │
│  document-scanner · health-score-updater            │
└─────────────────┬───────────────────────────────────┘
                  │ Redis pub/sub
┌─────────────────▼───────────────────────────────────┐
│  Socket.io Server (port 3001)                       │
│  Real-time incident notifications to browser        │
└─────────────────────────────────────────────────────┘
```

**Data pipeline (per message):**
1. Webhook arrives → HMAC-SHA256 verified → queued in Redis
2. Regex pre-filter for Indian PII (Aadhaar, PAN, mobile, GSTIN)
3. If PII found → Claude Sonnet API for context classification
4. Risk scoring matrix (entity types × count × severity × repeat offender multiplier)
5. Remediation suggestions cached in Redis by rule-code combo
6. Incident created in PostgreSQL (entity types only, no PII values)
7. Health score recalculated; socket event emitted to org room
8. Alerts sent via WhatsApp + email to compliance officers

## Environment Variables

Copy `.env.example` to `.env` and fill in:

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (with password) |
| `NEXTAUTH_SECRET` | Random 32-char secret for JWT signing |
| `NEXTAUTH_URL` | Public URL (e.g. https://yourdomain.com) |
| `ANTHROPIC_API_KEY` | Claude API key from console.anthropic.com |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM (run: `openssl rand -hex 32`) |

### Integrations (add as you connect sources)
| Variable | Description |
|----------|-------------|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business WhatsApp Phone Number ID |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business API access token |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verify token (any string you choose) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_PUBSUB_TOPIC` | Pub/Sub topic for Gmail push notifications |
| `MICROSOFT_CLIENT_ID` | Azure AD app client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure AD app client secret |
| `MICROSOFT_TENANT_ID` | Azure AD tenant ID |

### Optional
| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay API key for billing |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |
| `S3_BUCKET_NAME` | S3 bucket for PDF reports |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | AWS region (default: ap-south-1) |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | Email SMTP username |
| `SMTP_PASS` | Email SMTP password |
| `SMTP_FROM` | From address (e.g. "KavachAI <noreply@yourdomain.com>") |

## Connecting Integrations

### WhatsApp Business
1. Go to Meta Business Manager → WhatsApp → API Setup
2. Copy Phone Number ID and access token to `.env`
3. Set webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
4. Subscribe to `messages` and `message_deliveries` events
5. Set verify token to match `WHATSAPP_VERIFY_TOKEN`

### Gmail / Google Drive
1. Create a project in Google Cloud Console
2. Enable Gmail API and Google Drive API
3. Create OAuth 2.0 credentials (Web application)
4. Add `https://yourdomain.com/api/oauth/google/callback` as redirect URI
5. Copy client ID and secret to `.env`
6. Set up Pub/Sub topic for Gmail push notifications (for real-time scanning)

### Microsoft Outlook / OneDrive
1. Register an app in Azure Active Directory
2. Add permissions: Mail.Read, Files.Read.All, offline_access
3. Add `https://yourdomain.com/api/oauth/microsoft/callback` as redirect URI
4. Copy client ID, secret, and tenant ID to `.env`

## Production Deployment

```bash
# Build Docker images
docker build -f docker/Dockerfile.app -t kavachai-app:latest .
docker build -f docker/Dockerfile.worker -t kavachai-worker:latest .

# Generate SSL certificate (or mount existing)
mkdir -p docker/ssl
# Copy cert.pem and key.pem into docker/ssl/

# Copy and fill in production env
cp .env.example .env.production

# Run database migrations
DATABASE_URL=<prod_url> npx prisma migrate deploy

# Start production stack
VERSION=latest docker compose -f docker-compose.prod.yml up -d
```

## Compliance Frameworks

KavachAI monitors for violations across:
- **DPDP Act 2023** — India's primary data protection law (always active)
- **IT Act 2000** — Cybersecurity and digital compliance (always active)
- **RBI Guidelines** — Banks, NBFCs, payment companies
- **SEBI Regulations** — Investment advisors, stockbrokers
- **IRDAI Guidelines** — Insurance companies
- **NMC Code** — Doctors, clinics, hospitals
- **Bar Council Rules** — Law firms and advocates
- **Labour Laws** — PF Act, POSH Act, Contract Labour Act
- **POCSO Act** — EdTech and children's platforms

## Pricing

| Plan | Price | Frameworks | Sources | Users |
|------|-------|-----------|---------|-------|
| Starter | ₹2,999/mo | 1 | 1 | 15 |
| Professional | ₹6,999/mo | 3 | All | 75 |
| Guardian | ₹12,999/mo | Unlimited | All | Unlimited |

14-day free trial, no credit card required.

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Next.js API routes, BullMQ workers, Socket.io
- **Database**: PostgreSQL 16 + Prisma v5
- **Queue**: BullMQ + Redis 7
- **AI**: Anthropic Claude Sonnet (PII detection, risk analysis, remediation)
- **Auth**: NextAuth.js v5 (credentials + Google OAuth)
- **Billing**: Razorpay subscriptions (INR)
- **PDF**: Puppeteer (Chromium headless)
- **Storage**: AWS S3 / MinIO
- **Infrastructure**: Docker, Nginx, PM2

## License

Proprietary — KavachAI © 2024
