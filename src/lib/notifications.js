import { doc, updateDoc } from 'firebase/firestore'
import { db, requestPushPermission } from './firebase'

/**
 * Fragt Push-Erlaubnis an und speichert den FCM-Token beim Spieler in Firestore.
 * Aufrufen sobald der Spieler in der Lobby erscheint.
 *
 * iOS-Voraussetzungen:
 * - App muss als PWA installiert sein ("Zum Home-Bildschirm hinzufügen")
 * - iOS 16.4+
 * - VITE_FCM_VAPID_KEY muss in der .env gesetzt sein
 */
export async function registerForPush(sessionCode, playerId, players) {
  try {
    const token = await requestPushPermission()
    if (!token) return null

    // Lokal cachen für schnellen Zugriff
    localStorage.setItem('riot_fcm_token', token)

    // FCM-Token beim Spieler-Objekt in Firestore speichern
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, fcmToken: token } : p
    )
    await updateDoc(doc(db, 'sessions', sessionCode), { players: updatedPlayers })
    console.log('[Push] Token gespeichert')
    return token
  } catch (err) {
    console.warn('[Push] Registrierung fehlgeschlagen:', err)
    return null
  }
}

/**
 * Sendet eine Push-Nachricht über die Vercel-API-Route an einen Spieler.
 * Nur der Host ruft dies auf – direkt aus dem Browser.
 */
export async function sendPushToPlayer(fcmToken, title, body) {
  if (!fcmToken) return
  try {
    const res = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fcmToken, title, body }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[Push] API Fehler:', err)
    }
  } catch (err) {
    console.warn('[Push] Senden fehlgeschlagen:', err)
  }
}
