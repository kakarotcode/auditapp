/**
 * Robustly extracts JSON from a Claude response.
 *
 * Models often wrap JSON in markdown code fences (```json ... ```) or add a
 * little surrounding prose. A naive JSON.parse on the raw text then throws,
 * which previously made the AI pipeline silently fall back to conservative
 * defaults (and miss real violations). This strips fences and, as a last
 * resort, grabs the first {...} / [...] block before parsing.
 */
export function extractJson<T = unknown>(text: string): T {
  let t = (text ?? '').trim()

  // Strip a ```json ... ``` or ``` ... ``` code fence if present.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fence) t = fence[1].trim()

  try {
    return JSON.parse(t) as T
  } catch {
    // Last resort: extract the first JSON object or array in the text.
    const match = t.match(/[{[][\s\S]*[}\]]/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error('No parseable JSON found in model response')
  }
}
