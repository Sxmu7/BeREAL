import { GoogleAuth } from 'google-auth-library'

/**
 * Vercel Serverless Function – sendet eine FCM Push-Nachricht.
 *
 * POST /api/send-notification
 * Body: { token: string, title: string, body: string }
 *
 * Benötigte Umgebungsvariable in Vercel:
 *   FIREBASE_SERVICE_ACCOUNT_KEY  ← kompletten JSON-Inhalt als String einfügen
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token, title, body } = req.body || {}
  if (!token) return res.status(400).json({ error: 'token required' })

  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!keyJson) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not configured' })
  }

  try {
    const serviceAccount = JSON.parse(keyJson)
    const projectId = serviceAccount.project_id

    // OAuth2-Token über Service Account holen
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    const client = await auth.getClient()
    const { token: accessToken } = await client.getAccessToken()

    // FCM HTTP v1 API aufrufen
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: {
              notification: {
                title,
                body,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                vibrate: [200, 100, 200],
                requireInteraction: false,
                tag: 'riot-turn',          // ersetzt vorherige Notification
              },
              fcm_options: { link: '/' },
            },
          },
        }),
      }
    )

    const result = await fcmRes.json()
    if (!fcmRes.ok) return res.status(502).json({ error: result })
    return res.status(200).json({ ok: true, messageId: result.name })
  } catch (err) {
    console.error('[FCM] Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
