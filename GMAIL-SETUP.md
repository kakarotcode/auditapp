# Gmail Integration Setup (free)

Enables real Gmail scanning + "Sign in with Google". Creating the Google app is
**free** (only the AI key costs money). ~20 minutes.

The integration code already exists and is complete (`lib/integrations/gmail.ts`).
You just need to create a Google OAuth app and paste the credentials.

---

## Step 1 — Create a Google Cloud project (free)
1. Go to https://console.cloud.google.com → create a new project (e.g. "KavachAI").

## Step 2 — Enable APIs
In **APIs & Services → Library**, enable:
- **Gmail API**
- **Google Drive API** (if you also want Drive scanning)
- **Cloud Pub/Sub API** (needed for Gmail push notifications)

## Step 3 — OAuth consent screen
1. **APIs & Services → OAuth consent screen** → External → fill app name, support email.
2. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `openid`, `email`, `profile` (for login)
3. Add your own email as a **Test user** (so you can use it before Google verifies the app).
   > Note: publishing for *other* users later requires Google's OAuth review (can take weeks).

## Step 4 — Create OAuth credentials
**APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.**
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (local login)
  - `https://<your-app>.onrender.com/api/auth/callback/google` (production login)
  - plus your data-source connect callback if different
- Copy the **Client ID** and **Client secret**.

## Step 5 — Set env vars
```env
# Login with Google
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>

# Gmail/Drive data-source scanning (can reuse the same client)
GOOGLE_WORKSPACE_CLIENT_ID=<client id>
GOOGLE_WORKSPACE_CLIENT_SECRET=<client secret>

# For Gmail push notifications (Pub/Sub topic you create in step 6)
GOOGLE_PUBSUB_TOPIC=projects/<project-id>/topics/<topic-name>
```

## Step 6 — (Optional) Gmail push notifications
For real-time scanning, Gmail pushes new-mail events to a Pub/Sub topic:
1. **Pub/Sub → Create topic** (e.g. `kavachai-gmail`).
2. Grant `gmail-api-push@system.gserviceaccount.com` the **Pub/Sub Publisher** role on it.
3. Add a **push subscription** pointing to `https://<your-app>/api/webhooks/gmail`.
4. Set `GOOGLE_PUBSUB_TOPIC` as above.

> Without Pub/Sub you can still test by polling — the `getMessagesSinceHistory`
> function works once a source is connected; push just makes it real-time.

## Step 7 — Test it
1. Restart the app with the new env vars.
2. **Sign in with Google** on the login page should now work.
3. On **Sources**, connect the Gmail account.
4. Send yourself a test email containing a fake Aadhaar (e.g. `4321 8765 9012`)
   or PAN (`ABCDE1234F`).
5. With `npm run worker` running **and a real `ANTHROPIC_API_KEY`**, an incident
   should appear on the dashboard.

   Or simulate without waiting for real mail:
   ```bash
   npx tsx scripts/simulate-message.ts
   ```

---

### What works without this
Login still works via email/password (`admin@mehtaca.com` / `Demo@1234`).
This setup only adds Google login + live Gmail/Drive scanning.
