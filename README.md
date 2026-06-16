# DareDrop

> "Accept the dare. Or take the drink."

Multiplayer Social-Challenge-PWA. Dieses Paket enthält **Landing Page + Onboarding (Name & Charakter) + Main Menu + Rules**, voll funktionsfähig und animiert. Lobby, Host-Flow, Wheel/Gameplay, Voting und Firebase-Multiplayer folgen in den nächsten Bauabschnitten.

## Setup

```bash
npm install
npm run dev
```

Build für Produktion:

```bash
npm run build
```

## Was noch von dir eingerichtet werden muss

### 1. Firebase-Projekt
Neues Firebase-Projekt anlegen, dann in **zwei Dateien** die echten Config-Werte eintragen:
- `src/lib/firebase.js`
- `public/firebase-messaging-sw.js` (Service Worker hat keinen Zugriff auf die App-Config, deshalb doppelt)

Firestore und Storage in der Console aktivieren.

### 2. Push-Notifications (Firebase Cloud Messaging)
1. Firebase Console → Project Settings → Cloud Messaging → Web Push Zertifikat generieren (VAPID Key)
2. VAPID Key in `src/lib/firebase.js` eintragen
3. Domain in Vercel deployen (Push braucht HTTPS, localhost funktioniert nur eingeschränkt)

**Wichtige Einschränkung, die das Grundkonzept betrifft:** Web Push funktioniert auf iOS erst ab iOS 16.4 und **nur**, wenn die App über "Zum Home-Bildschirm hinzufügen" als PWA installiert wurde – nicht im normalen Safari-Tab. Das heißt: Spieler, die DareDrop nur im Browser öffnen, bekommen auf iPhones **keine** Push-Benachrichtigungen, egal wie gut FCM eingerichtet ist. Für das im Brief beschriebene Verhalten ("Random rounds start automatically through push notifications" während Leute auf Festivals/in Bars sind) sollte die App deshalb zusätzlich einen In-App-Fallback haben (Firestore-Listener, der neue Runden erkennt, solange die App offen oder im Hintergrund-Tab ist). Das bauen wir in den nächsten Schritten mit ein.

Android unterstützt Web Push zuverlässiger, auch ohne Installation als PWA.

### 3. Icons
`public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` sowie `public/apple-touch-icon.png` und `public/favicon.svg` fehlen noch – aktuell nur als Pfade im Manifest referenziert. Sag Bescheid, wenn ich dafür ein Icon-Design entwerfen soll.

### 4. Deployment
Wie bei deinen anderen Projekten: GitHub-Repo anlegen, mit Vercel verbinden, Firebase-Env-Werte als Vercel Environment Variables hinterlegen (nicht hart im Code, sobald öffentlich).

## Aktueller Stand

| Bereich | Status |
|---|---|
| Landing Page (Hero + animierte Flow-Preview) | ✅ fertig |
| Name-Screen | ✅ fertig |
| Charakter-Auswahl (8 Charaktere) | ✅ fertig |
| Main Menu | ✅ fertig |
| Rules-Screen | ✅ fertig (Platzhaltertext, gerne anpassen) |
| Host-Setup (alle Settings aus dem Brief) | ✅ fertig |
| Join-Screen (Code-Eingabe) | ✅ fertig, QR-Scan folgt |
| Lobby (Live-Sync, Kreis-Layout, Host-Steuerung) | ✅ fertig |
| Wheel-Spin (synchronisierte Animation) | ✅ fertig |
| Challenge-Screen (Annehmen/Strafe, Timer) | ✅ fertig |
| Video-Proof-Aufnahme & Upload | ✅ fertig |
| Spectator-Mode | ✅ fertig |
| Voting & Mehrheitsentscheid | ✅ fertig |
| Battle Rounds (alle bekommen gleiche Challenge) | ⏳ offen |
| Party-Recap am Session-Ende | ⏳ offen |
| Push-Notifications (FCM) | 🔧 vorbereitet, braucht deine Console-Einrichtung |

## Wichtiger Hinweis: Storage-Cleanup für Videos

Der Brief fordert, dass Beweisvideos nach der Abstimmung automatisch gelöscht werden ("Storage Rules: Videos and photos are TEMPORARY"). Das aktuelle Paket lädt Videos zu Firebase Storage hoch und referenziert die URL in `currentRound.proofUrl`, löscht sie aber noch **nicht** automatisch – das sollte nicht der Client übernehmen (zu unzuverlässig, falls jemand die App vorher schließt), sondern eine **Firebase Cloud Function**, die auf `currentRound.phase === 'result'` reagiert und die Datei unter `proofs/{sessionCode}/...` löscht. Das ist der nächste sinnvolle Schritt, sobald Cloud Functions eingerichtet sind (braucht den Blaze-Tarif von Firebase, da Functions nicht im kostenlosen Spark-Plan laufen).

## Wie der Round-Flow synchronisiert ist

Alle Geräte abonnieren das gleiche Firestore-Dokument (`sessions/{code}`). Der Host startet neue Runden und treibt den Übergang vom Wheel zur Challenge-Phase an; danach reagiert jedes Gerät eigenständig auf Phasenwechsel im Dokument. Die Abstimmung wird von jedem Client geprüft (nicht nur vom Host), damit die Auswertung auch dann passiert, wenn der Host selbst mitstimmt und zufällig zuletzt an der Reihe ist.

## Design-Update

Die erste Fassung war zu bunt (Magenta/Cyan/Amber gleichzeitig im Bild, je Charakter eine eigene Farbe). Überarbeitet auf ein minimalistisches System: ein gedämpfter Akzent (`--color-dare`, dunkles Rot-Magenta) statt mehrerer lauter Farben, Glow-Effekte stark zurückgenommen, Charaktere und Menü-Karten jetzt einheitlich neutral. Die Typografie (Archivo Black für Display, Inter für Body, Space Mono für Zahlen/Codes) wurde beibehalten.

## Firestore-Struktur (Lobby/Session)

```
sessions/{sessionCode}
  hostId: string
  sessionName: string
  status: 'lobby' | 'active' | 'ended'
  settings: { gameMode, challengeFrequency, customIntervalMin/Max,
              challengeTimer, difficulty, battleRoundEvery, punishmentLevel }
  players: [{ id, name, characterId, drink, isHost, joinedAt }]
```

Sessions brauchen aktuell **keine** Firestore-Security-Rules-Einschränkung testweise (offener Zugriff), das sollte vor einem öffentlichen Launch noch auf Regeln umgestellt werden (z. B. nur Felder ändern, kein beliebiges Löschen). Sag Bescheid, wenn ich dafür Security Rules entwerfen soll.

## Design-System

Alle Farben/Schriften/Abstände sind zentral in `src/styles/tokens.css` als CSS-Variablen definiert. Signature-Element ist die kreisförmige "Stage" (`src/components/CircleStage.jsx`), die sich durch Landing Page, später auch Wheel und Lobby zieht.
