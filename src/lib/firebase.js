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
  try {
    // Grundvoraussetzungen prüfen (iOS PWA braucht beides)
    if (typeof Notification === 'undefined') return null
    if (!('serviceWorker' in navigator)) return null
    if (!('PushManager' in window)) return null

    const supported = await isSupported().catch(() => false)
    if (!supported) return null

    // Permission anfragen (muss nach User-Gesture passieren)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    // Firebase Messaging SW registrieren
    let swReg
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
        updateViaCache: 'none',
      })
    } catch {
      // Fallback: scope '/' falls der enge scope nicht klappt
      try {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
      } catch (err) {
        console.warn('[FCM] SW-Registrierung fehlgeschlagen:', err)
        return null
      }
    }

    // Auf DIESEN spezifischen SW warten (nicht navigator.serviceWorker.ready,
    // das könnte den Vite-PWA-SW zurückgeben)
    await new Promise((resolve) => {
      if (swReg.active) return resolve()
      const sw = swReg.installing || swReg.waiting
      if (!sw) return resolve()
      sw.addEventListener('statechange', function handler() {
        if (sw.state === 'activated') {
          sw.removeEventListener('statechange', handler)
          resolve()
        }
      })
      // Timeout nach 5s damit es nicht ewig hängt
      setTimeout(resolve, 5000)
    })

    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })
    console.log('[FCM] Token erhalten:', token ? '✓' : 'null')
    return token || null
  } catch (err) {
    console.warn('[FCM] Token-Erstellung fehlgeschlagen:', err)
    return null
  }
}
