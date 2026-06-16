import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'

// DareDrop – eigenes Firebase-Projekt (daredrop-fe5b8), getrennt von
// Anlegen/THE Cards. Kein databaseURL nötig, da DareDrop Firestore
// statt Realtime Database nutzt. Kein Firebase Storage, da Storage
// in diesem Projekt den Blaze-Plan voraussetzt – Video-Proofs laufen
// daher als Base64 direkt über Firestore (siehe VideoProofRecorder.jsx).
const firebaseConfig = {
  apiKey: 'AIzaSyBMUIbRNPw66r-TtQEThION_EM1SdKK9K0',
  authDomain: 'daredrop-fe5b8.firebaseapp.com',
  projectId: 'daredrop-fe5b8',
  storageBucket: 'daredrop-fe5b8.firebasestorage.app',
  messagingSenderId: '74200708681',
  appId: '1:74200708681:web:43cf7dcde916f3121ef198',
  measurementId: 'G-GFMCRQL16G'
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

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
 * 2. VAPID Key unten eintragen (noch TODO, siehe Platzhalter)
 * 3. /public/firebase-messaging-sw.js mit der echten firebaseConfig befüllen
 *    (bereits eingetragen)
 */
export async function requestPushPermission() {
  const supported = await isSupported().catch(() => false)
  if (!supported) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: 'DEIN_VAPID_KEY' // TODO: aus Firebase Console → Cloud Messaging → Web Push certificates
    })
    return token || null
  } catch (err) {
    console.warn('FCM-Token konnte nicht erstellt werden:', err)
    return null
  }
}
