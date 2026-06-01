/**
 * Run once after connecting Gmail and OneDrive sources to register
 * push notification subscriptions with Google and Microsoft.
 *
 * Usage: npx ts-node scripts/setup-subscriptions.ts
 */

import { db } from '../lib/db'
import { setupPushNotifications } from '../lib/integrations/gmail'
import { createWebhookSubscription } from '../lib/integrations/outlook'
import { createSubscription } from '../lib/integrations/onedrive'
import { decrypt } from '../lib/crypto'

async function main() {
  console.log('Setting up webhook subscriptions for all active sources...')

  const sources = await db.dataSource.findMany({
    where: { status: 'ACTIVE' },
    include: { org: true },
  })

  for (const source of sources) {
    console.log(`Processing ${source.type} for org ${source.org.name}`)

    try {
      const token = source.encryptedToken ? decrypt(source.encryptedToken) : null
      if (!token) { console.warn(`  Skipping ${source.id} — no access token`); continue }

      switch (source.type) {
        case 'GMAIL':
          await setupPushNotifications(token, source.orgId)
          console.log(`  ✓ Gmail push notifications registered`)
          break
        case 'OUTLOOK':
          await createWebhookSubscription(token, source.orgId)
          console.log(`  ✓ Outlook Graph subscription created`)
          break
        case 'GOOGLE_DRIVE':
          // Google Drive watches are registered per-file via the watchFile function
          // during source connection, not in bulk here
          console.log(`  Skipping GOOGLE_DRIVE — watches registered on connect`)
          break
        case 'ONEDRIVE':
          await createSubscription(token, source.orgId)
          console.log(`  ✓ OneDrive subscription created`)
          break
        default:
          console.log(`  Skipping ${source.type} (no subscription needed)`)
      }
    } catch (err) {
      console.error(`  ✗ Failed for ${source.id}:`, err)
    }
  }

  console.log('Done.')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
