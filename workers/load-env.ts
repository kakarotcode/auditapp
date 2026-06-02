/**
 * Loads the project .env into process.env for the standalone worker process.
 *
 * `npm run worker` runs `tsx workers/index.ts` directly, which (unlike Next.js)
 * does NOT auto-load .env. Without this, env vars like ANTHROPIC_API_KEY are
 * undefined in the worker and AI calls fail with "Could not resolve
 * authentication method".
 *
 * This MUST be the first import in workers/index.ts so it runs before the AI
 * client modules (which read process.env at module load) are evaluated.
 *
 * Zero-dependency (no `dotenv` package needed). Only sets vars that aren't
 * already defined, so platform-provided env (e.g. on Render) always wins and a
 * missing .env file in production is a harmless no-op.
 */
import { readFileSync } from 'fs'
import { join } from 'path'

try {
  const raw = readFileSync(join(process.cwd(), '.env'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value
    }
  }
} catch {
  // No .env file (e.g. production) — rely on platform-provided env.
}
