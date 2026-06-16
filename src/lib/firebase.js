import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'

// WICHTIG: Diese Werte aus der Firebase Console eintragen
// (Projekteinstellungen → Allgemein → "Meine Apps" → Web-App).
// Achtung: Die Standard-Config aus der Console lässt oft das Feld
// `databaseURL` weg – falls Realtime Database genutzt wird (wie bei
// Anlegen/THE Cards), dieses Feld manuell ergänzen.
const firebaseConfig = {
  apiKey: 'DEIN_API_KEY',
  authDomain: 'DEIN_PROJECT.firebaseapp.com',
  projectId: 'DEIN_PROJECT',
  storageBucket: 'DEIN_PROJECT.appspot.com',
  messagingSenderId: 'DEINE_SENDER_ID',
  appId: 'DEINE_APP_ID'
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

/**
 * Fragt Push-Berechtigung an und liefert den FCM-Token zurück.
 *
 * Wichtige Einschränkung: Auf iOS funktioniert Web Push erst ab iOS 16.4
 * und NUR, wenn die App über "Zum Home-Bildschirm hinzufügen" installiert
 * wurde – nicht im normalen Safari-Tab. Diese Funktion gibt in dem Fall
 * `null` zurück, die App muss dann auf In-App-Polling/Listener zurückfallen.
 *
 * Voraussetzung in der Firebase Console:
 * 1. Cloud Messaging aktivieren, Web-Push-Zertifikat (VAPID Key) generieren
 * 2. VAPID Key unten eintragen
 * 3. /public/firebase-messaging-sw.js mit der echten firebaseConfig befüllen
 */
export async function requestPushPermission() {
  const supported = await isSupported().catch(() => false)
  if (!supported) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: 'DEIN_VAPID_KEY'
    })
    return token || null
  } catch (err) {
    console.warn('FCM-Token konnte nicht erstellt werden:', err)
    return null
  }
}
