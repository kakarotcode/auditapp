import Anthropic from '@anthropic-ai/sdk'
import { PII_DETECTION_SYSTEM_PROMPT } from './prompts'
import { extractJson } from './json'
import type { PiiDetectionResult, DetectedEntity, DataCategory } from '@/lib/compliance/types'

// ---------------------------------------------------------------------------
// Regex patterns for Indian PII — compiled once at module load
// ---------------------------------------------------------------------------

// Aadhaar: 12 digits optionally grouped in 4s
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/g

// PAN: 5 uppercase letters + 4 digits + 1 uppercase letter
const PAN_REGEX = /\b[A-Z]{5}\d{4}[A-Z]\b/g

// Indian mobile: optional +91 or leading 0, then 10 digits starting 6–9
const MOBILE_REGEX = /\b(?:\+91|0)?[6-9]\d{9}\b/g

// GSTIN: 2-digit state + 10-char PAN + 1 entity type + Z + 1 check char
const GSTIN_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/g

// Bank account: 9–18 consecutive digits (broad; context-dependent)
const BANK_ACCOUNT_REGEX = /\b\d{9,18}\b/g

// Email address
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

// ---------------------------------------------------------------------------
// Health-related keyword list (English + Hindi)
// ---------------------------------------------------------------------------
const HEALTH_KEYWORDS: string[] = [
  // Hindi
  'बीमारी', 'दवा', 'दवाई', 'रोगी', 'मरीज', 'इलाज', 'अस्पताल', 'डॉक्टर',
  'परिणाम', 'रिपोर्ट', 'निदान', 'रक्त', 'शुगर', 'मधुमेह',
  // English
  'diagnosis', 'patient', 'treatment', 'medicine', 'medication', 'hospital',
  'doctor', 'prescription', 'blood', 'sugar', 'diabetes', 'hypertension',
  'BP', 'blood pressure', 'cancer', 'HIV', 'AIDS', 'report', 'test result',
  'lab report', 'radiology', 'MRI', 'CT scan', 'biopsy', 'discharge summary',
  'OPD', 'IPD', 'surgery', 'operation', 'pregnancy', 'mental health',
  'psychiatric', 'depression', 'anxiety', 'disability', 'thyroid', 'cholesterol',
]

// ---------------------------------------------------------------------------
// Local pre-filter: fast regex pass before calling Claude
// ---------------------------------------------------------------------------
interface LocalFilterResult {
  found: boolean
  entityTypes: string[]
}

function localPreFilter(text: string): LocalFilterResult {
  const found: string[] = []
  const lower = text.toLowerCase()

  // Reset lastIndex on all global regexes before testing
  AADHAAR_REGEX.lastIndex = 0
  PAN_REGEX.lastIndex = 0
  MOBILE_REGEX.lastIndex = 0
  GSTIN_REGEX.lastIndex = 0
  EMAIL_REGEX.lastIndex = 0
  BANK_ACCOUNT_REGEX.lastIndex = 0

  if (AADHAAR_REGEX.test(text)) found.push('AADHAAR_NUMBER')
  if (PAN_REGEX.test(text)) found.push('PAN_NUMBER')
  if (MOBILE_REGEX.test(text)) found.push('MOBILE_NUMBER')
  if (GSTIN_REGEX.test(text)) found.push('GSTIN')
  if (EMAIL_REGEX.test(text)) found.push('EMAIL_ADDRESS')
  if (HEALTH_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))) found.push('HEALTH_CONDITION')

  // Reset again after use
  AADHAAR_REGEX.lastIndex = 0
  PAN_REGEX.lastIndex = 0
  MOBILE_REGEX.lastIndex = 0
  GSTIN_REGEX.lastIndex = 0
  EMAIL_REGEX.lastIndex = 0
  BANK_ACCOUNT_REGEX.lastIndex = 0

  return { found: found.length > 0, entityTypes: found }
}

// ---------------------------------------------------------------------------
// Anthropic client — instantiated once
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface ClaudeDetectionPayload {
  hasPersonalData: boolean
  entities: DetectedEntity[]
  dataCategories: DataCategory[]
  rawSummary: string
}

export async function detectPii(text: string): Promise<PiiDetectionResult> {
  const start = Date.now()

  // Truncate to a reasonable context window for the API call
  const truncated = text.slice(0, 2000)

  const localResult = localPreFilter(truncated)

  // Fast exit: very short text with no local hits is almost certainly clean
  if (!localResult.found && truncated.length < 50) {
    return {
      hasPersonalData: false,
      entities: [],
      dataCategories: [],
      rawSummary: 'No personal data detected',
      detectionMethod: 'LOCAL',
      processingMs: Date.now() - start,
    }
  }

  // Call Claude for deep semantic analysis
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    system: PII_DETECTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this text for personal data:\n\n${truncated}`,
      },
    ],
  })

  const contentBlock = response.content[0]
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type from Claude API')
  }

  let parsed: ClaudeDetectionPayload
  try {
    parsed = extractJson<ClaudeDetectionPayload>(contentBlock.text)
  } catch {
    // Graceful fallback: trust local regex result
    parsed = {
      hasPersonalData: localResult.found,
      entities: localResult.entityTypes.map(t => ({
        type: t as DetectedEntity['type'],
        confidence: 0.8,
      })),
      dataCategories: localResult.found ? ['PERSONAL_DATA'] : [],
      rawSummary: 'AI parse error — local detection result used',
    }
  }

  return {
    ...parsed,
    detectionMethod: localResult.found ? 'BOTH' : 'AI',
    processingMs: Date.now() - start,
  }
}
