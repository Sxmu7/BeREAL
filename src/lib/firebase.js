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
 * iOS-Voraussetzungen:
 * - App als PWA installieren ("Zum Home-Bildschirm hinzufügen")
 * - iOS 16.4+
 *
 * Konfiguration:
 * 1. Firebase Console → Projekteinstellungen → Cloud Messaging
 *    → Web-Push-Zertifikate → Schlüsselpaar generieren → VAPID Key kopieren
 * 2. In .env.local und Vercel Env-Vars eintragen:
 *    VITE_FCM_VAPID_KEY=<dein VAPID Key>
 */
export async function requestPushPermission() {
  const supported = await isSupported().catch(() => false)
  if (!supported) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
    })
    return token || null
  } catch (err) {
    console.warn('[FCM] Token-Erstellung fehlgeschlagen:', err)
    return null
  }
}
