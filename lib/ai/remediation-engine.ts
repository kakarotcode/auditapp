import Anthropic from '@anthropic-ai/sdk'
import Redis from 'ioredis'
import { REMEDIATION_SYSTEM_PROMPT } from './prompts'
import { extractJson } from './json'
import type { EntityType, Vertical } from '@/lib/compliance/types'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Redis client — singleton with error-resilient initialisation
// ---------------------------------------------------------------------------

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis !== null) return redis

  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
    })

    client.on('error', (err: Error) => {
      // Log but do not crash — remediation can work without cache
      logger.warn('[RemediationEngine] Redis error (non-fatal):', err.message)
    })

    redis = client
    return redis
  } catch (err) {
    logger.warn('[RemediationEngine] Failed to initialise Redis (non-fatal):', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

function buildCacheKey(ruleCodes: string[], vertical: Vertical): string {
  return `remediation:${[...ruleCodes].sort().join(',')}:${vertical}`
}

async function getCached(key: string): Promise<string[] | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const value = await client.get(key)
    if (!value) return null
    return JSON.parse(value) as string[]
  } catch {
    return null
  }
}

async function setCache(key: string, steps: string[]): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.setex(key, CACHE_TTL_SECONDS, JSON.stringify(steps))
  } catch {
    // Non-fatal — just skip caching
  }
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

async function generateRemediationSteps(
  ruleCodes: string[],
  entityTypes: EntityType[],
  vertical: Vertical,
): Promise<string[]> {
  const payload = { ruleCodes, entityTypes, vertical }

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    system: REMEDIATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate remediation steps for this compliance violation:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  })

  const contentBlock = response.content[0]
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type from Claude API during remediation generation')
  }

  let steps: string[]
  try {
    steps = extractJson<string[]>(contentBlock.text)
    if (!Array.isArray(steps)) throw new Error('Response is not an array')
    // Filter out any non-string items
    steps = steps.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    if (steps.length === 0) throw new Error('Empty steps array')
  } catch {
    // Fallback: produce generic steps based on ruleCodes
    steps = buildFallbackSteps(ruleCodes, vertical)
  }

  return steps
}

// ---------------------------------------------------------------------------
// Fallback step generator (no AI — used when parse fails)
// ---------------------------------------------------------------------------

function buildFallbackSteps(ruleCodes: string[], vertical: Vertical): string[] {
  const steps: string[] = [
    'Step 1: Within 72 hours — Identify all individuals whose personal data was affected and document the scope of the incident in your Data Breach Register as required by DPDP Act Section 16(1).',
    `Step 2: Within 7 days — Obtain or re-confirm valid, purpose-specific written consent from all affected data principals for the processing activities that triggered this violation (DPDP Act Section 7). Retain signed consent records for a minimum of 3 years.`,
    `Step 3: Within 30 days — Review and update your internal data handling procedures for the ${vertical} workflow. Ensure personal data is only transmitted to registered, contracted third parties with a valid Data Processing Agreement in place (DPDP Act Section 8).`,
    `Step 4: Within 30 days — Appoint or consult a certified Data Protection Officer (DPO) to conduct a Data Protection Impact Assessment (DPIA) for workflows involving sensitive personal data (DPDP Act Section 22A). Document findings and corrective actions.`,
    `Step 5: Within 60 days — Train all staff who handle personal data on DPDP Act obligations and sector-specific rules. Maintain training attendance records for DPB audit readiness. Violated rules: ${ruleCodes.join(', ')}.`,
  ]
  return steps
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function getRemediationSteps(
  ruleCodes: string[],
  entityTypes: EntityType[],
  vertical: Vertical,
): Promise<string[]> {
  if (ruleCodes.length === 0) {
    return ['No rule violations identified — no remediation steps required.']
  }

  const cacheKey = buildCacheKey(ruleCodes, vertical)

  // Try cache first
  const cached = await getCached(cacheKey)
  if (cached !== null && cached.length > 0) {
    return cached
  }

  // Generate via Claude
  const steps = await generateRemediationSteps(ruleCodes, entityTypes, vertical)

  // Persist to cache asynchronously (don't await — non-blocking)
  setCache(cacheKey, steps).catch(() => {
    // Intentionally swallowed — caching is best-effort
  })

  return steps
}
