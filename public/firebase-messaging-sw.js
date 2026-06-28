/**
 * Firebase Messaging Service Worker
 *
 * Läuft im Hintergrund und zeigt Push-Benachrichtigungen an,
 * auch wenn die App geschlossen oder das Telefon gesperrt ist.
 *
 * WICHTIG: Diese Datei muss im public/-Verzeichnis liegen und darf
 * NICHT vom Vite-PWA-SW gecacht werden (siehe vite.config.js → workbox.exclude).
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBMUIbRNPw66r-TtQEThION_EM1SdKK9K0',
  authDomain: 'daredrop-fe5b8.firebaseapp.com',
  projectId: 'daredrop-fe5b8',
  storageBucket: 'daredrop-fe5b8.firebasestorage.app',
  messagingSenderId: '74200708681',
  appId: '1:74200708681:web:43cf7dcde916f3121ef198',
})

const messaging = firebase.messaging()

// Hintergrund-Nachrichten anzeigen (App geschlossen / Bildschirm gesperrt)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '⚡ RIOT'
  const body = payload.notification?.body || 'Du bist dran!'

  return self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'riot-turn',
    renotify: true,
    requireInteraction: false,
    data: { url: '/' },
  })
})

// Notification-Klick → App öffnen / in den Vordergrund holen
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Offenes Fenster fokussieren
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        // Kein Fenster offen → neu öffnen
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})
