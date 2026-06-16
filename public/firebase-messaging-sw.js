// Firebase Cloud Messaging – Background Service Worker
// Muss unter /firebase-messaging-sw.js (Root) liegen, damit FCM ihn findet.
//
// WICHTIG: Diese Datei braucht die echte firebaseConfig (gleiche Werte
// wie in src/lib/firebase.js), weil Service Worker keinen Zugriff auf
// das Bundle/ENV-Variablen der App haben.

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'DEIN_API_KEY',
  authDomain: 'DEIN_PROJECT.firebaseapp.com',
  projectId: 'DEIN_PROJECT',
  storageBucket: 'DEIN_PROJECT.appspot.com',
  messagingSenderId: 'DEINE_SENDER_ID',
  appId: 'DEINE_APP_ID'
})

const messaging = firebase.messaging()

// Zeigt eine Benachrichtigung, wenn die App im Hintergrund/geschlossen ist.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'DareDrop'
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {}
  }
  self.registration.showNotification(title, options)
})

// Klick auf die Benachrichtigung öffnet die App.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
