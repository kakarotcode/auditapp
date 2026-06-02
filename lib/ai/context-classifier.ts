import Anthropic from '@anthropic-ai/sdk'
import { CONTEXT_CLASSIFIER_SYSTEM_PROMPT } from './prompts'
import { extractJson } from './json'
import type { PiiDetectionResult, ClassificationResult } from '@/lib/compliance/types'

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface ClassificationInput {
  piiResult: PiiDetectionResult
  senderRole: string
  recipientType: 'INTERNAL' | 'EXTERNAL' | 'UNKNOWN'
  hasConsentRecord: boolean
  additionalContext?: string
}

interface ClaudeClassificationPayload {
  isViolation: boolean
  confidence: number
  reasoning: string
  applicableRules: string[]
}

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function classifyContext(input: ClassificationInput): Promise<ClassificationResult> {
  const { piiResult, senderRole, recipientType, hasConsentRecord, additionalContext } = input

  // If no personal data was detected we can short-circuit without an API call
  if (!piiResult.hasPersonalData || piiResult.entities.length === 0) {
    return {
      isViolation: false,
      confidence: 0.98,
      reasoning: 'No personal data detected in this communication — no violation possible.',
      applicableRules: [],
    }
  }

  // Build the payload Claude will analyse
  const eventPayload = {
    entityTypes: piiResult.entities.map(e => e.type),
    dataCategories: piiResult.dataCategories,
    senderRole,
    recipientType,
    hasConsentRecord,
    ...(additionalContext ? { additionalContext } : {}),
  }

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 600,
    system: CONTEXT_CLASSIFIER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Classify this data transmission event for compliance violations:\n\n${JSON.stringify(eventPayload, null, 2)}`,
      },
    ],
  })

  const contentBlock = response.content[0]
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type from Claude API during context classification')
  }

  let parsed: ClaudeClassificationPayload
  try {
    parsed = extractJson<ClaudeClassificationPayload>(contentBlock.text)
  } catch {
    // Graceful fallback: if we can't parse, apply a conservative heuristic
    const isSensitive =
      piiResult.dataCategories.includes('SENSITIVE_PERSONAL_DATA') ||
      piiResult.dataCategories.includes('HEALTH_DATA') ||
      piiResult.dataCategories.includes('FINANCIAL_DATA')

    const isRisky = (recipientType === 'EXTERNAL' || recipientType === 'UNKNOWN') && !hasConsentRecord

    return {
      isViolation: isSensitive && isRisky,
      confidence: 0.65,
      reasoning:
        'AI classification parse error — conservative heuristic applied based on entity types and recipient type.',
      applicableRules: isSensitive && isRisky ? ['DPDP-S7B-001'] : [],
    }
  }

  // Validate and normalise the response
  return {
    isViolation: Boolean(parsed.isViolation),
    confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No reasoning provided',
    applicableRules: Array.isArray(parsed.applicableRules) ? parsed.applicableRules : [],
  }
}
