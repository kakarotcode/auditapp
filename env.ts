import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Server-side environment variables — never exposed to the browser.
   */
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Database
    DATABASE_URL: z.string().min(1),

    // Redis
    REDIS_URL: z.string().min(1),

    // Auth
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Anthropic
    ANTHROPIC_API_KEY: z.string().min(1),

    // WhatsApp / Meta
    META_WHATSAPP_TOKEN: z.string().optional(),
    META_WHATSAPP_PHONE_ID: z.string().optional(),
    META_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
    META_APP_SECRET: z.string().optional(),

    // Google Workspace (Gmail / Drive)
    GOOGLE_WORKSPACE_CLIENT_ID: z.string().optional(),
    GOOGLE_WORKSPACE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_PUBSUB_TOPIC: z.string().optional(),

    // Microsoft Graph (Outlook / OneDrive)
    MICROSOFT_CLIENT_ID: z.string().optional(),
    MICROSOFT_CLIENT_SECRET: z.string().optional(),
    MICROSOFT_TENANT_ID: z.string().optional(),

    // AWS S3
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('ap-south-1'),
    AWS_S3_BUCKET: z.string().default('kavachai-storage'),

    // Razorpay
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    RAZORPAY_PLAN_STARTER: z.string().optional(),
    RAZORPAY_PLAN_PROFESSIONAL: z.string().optional(),
    RAZORPAY_PLAN_GUARDIAN: z.string().optional(),

    // SMTP / Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 587)),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().default('noreply@kavachai.in'),

    // Token encryption (AES-256 — must be 64-char hex = 32 bytes)
    TOKEN_ENCRYPTION_KEY: z.string().min(64),

    // Socket.io
    SOCKET_PORT: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 3001)),

    // Puppeteer
    PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  },

  /**
   * Client-side environment variables — exposed to the browser via NEXT_PUBLIC_ prefix.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default('KavachAI'),
  },

  /**
   * Manually destructure all env vars here so they can be validated and tree-shaken.
   * You'll get a TypeScript error if you're missing any.
   */
  runtimeEnv: {
    // Server
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN,
    META_WHATSAPP_PHONE_ID: process.env.META_WHATSAPP_PHONE_ID,
    META_WEBHOOK_VERIFY_TOKEN: process.env.META_WEBHOOK_VERIFY_TOKEN,
    META_APP_SECRET: process.env.META_APP_SECRET,
    GOOGLE_WORKSPACE_CLIENT_ID: process.env.GOOGLE_WORKSPACE_CLIENT_ID,
    GOOGLE_WORKSPACE_CLIENT_SECRET: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,
    GOOGLE_PUBSUB_TOPIC: process.env.GOOGLE_PUBSUB_TOPIC,
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
    MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RAZORPAY_PLAN_STARTER: process.env.RAZORPAY_PLAN_STARTER,
    RAZORPAY_PLAN_PROFESSIONAL: process.env.RAZORPAY_PLAN_PROFESSIONAL,
    RAZORPAY_PLAN_GUARDIAN: process.env.RAZORPAY_PLAN_GUARDIAN,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    SOCKET_PORT: process.env.SOCKET_PORT,
    PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION=1` to skip env validation.
   * This is useful for Docker builds where env vars are not available at build time.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined.
   */
  emptyStringAsUndefined: true,
})
