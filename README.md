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

### 1. Firebase-Projekt ✅ Config eingetragen
Projekt `daredrop-fe5b8` ist verbunden, die echten Werte stehen bereits in:
- `src/lib/firebase.js`
- `public/firebase-messaging-sw.js`

**Noch zu prüfen:** Sind in der Firebase Console für dieses Projekt **Firestore Database** und **Storage** bereits aktiviert? Falls nicht: linkes Menü → "Firestore Database" → Datenbank erstellen (Modus "Produktion" reicht), und → "Storage" → Erste Schritte. Ohne diese zwei aktivierten Dienste schlägt das Erstellen einer Lobby bzw. der Video-Upload mit einem Fehler fehl.

### 2. Push-Notifications (Firebase Cloud Messaging) – VAPID Key fehlt noch
1. Firebase Console → Project Settings → Cloud Messaging → Web Push Zertifikat generieren
2. Den generierten Key in `src/lib/firebase.js` eintragen, ersetzt `'DEIN_VAPID_KEY'` (Zeile mit `vapidKey:`)
3. Domain in Vercel deployen (Push braucht HTTPS, localhost funktioniert nur eingeschränkt)

**Wichtige Einschränkung, die das Grundkonzept betrifft:** Web Push funktioniert auf iOS erst ab iOS 16.4 und **nur**, wenn die App über "Zum Home-Bildschirm hinzufügen" als PWA installiert wurde – nicht im normalen Safari-Tab. Das heißt: Spieler, die DareDrop nur im Browser öffnen, bekommen auf iPhones **keine** Push-Benachrichtigungen, egal wie gut FCM eingerichtet ist. Für das im Brief beschriebene Verhalten ("Random rounds start automatically through push notifications" während Leute auf Festivals/in Bars sind) sollte die App deshalb zusätzlich einen In-App-Fallback haben (Firestore-Listener, der neue Runden erkennt, solange die App offen oder im Hintergrund-Tab ist).

Android unterstützt Web Push zuverlässiger, auch ohne Installation als PWA.

### 3. Icons
`public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` sowie `public/apple-touch-icon.png` und `public/favicon.svg` fehlen noch – aktuell nur als Pfade im Manifest referenziert. Sag Bescheid, wenn ich dafür ein Icon-Design entwerfen soll.

### 4. Deployment
Wie bei deinen anderen Projekten: GitHub-Repo anlegen, mit Vercel verbinden. Da die Firebase-Werte jetzt direkt im Code stehen (kein Secret, Firebase-Web-Config ist client-seitig sowieso öffentlich sichtbar), ist das unproblematisch – nur den VAPID Key würde ich genauso handhaben, der ist ebenfalls clientseitig öffentlich.

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

## Video-Proof ohne Firebase Storage (kein Blaze-Plan nötig)

Ursprünglich war geplant, Beweisvideos zu Firebase Storage hochzuladen. Storage verlangt bei diesem Projekt aber den kostenpflichtigen Blaze-Plan schon zum Einrichten (auch wenn man am Ende im kostenlosen Kontingent bleibt) – das wolltest du nicht. Stattdessen läuft es jetzt so: Das Video wird mit niedriger Auflösung/Bitrate aufgenommen, als Base64-Text direkt ins Firestore-Round-Dokument geschrieben (`currentRound.proofUrl`), und beim Start der nächsten Runde automatisch wieder auf `null` gesetzt – passend zu "Videos and photos are TEMPORARY" aus dem Brief, nur eben über Firestore statt Storage gelöst.

Wichtige Einschränkung: Firestore erlaubt maximal 1 MB pro Dokument, inklusive aller anderen Felder (Settings, Spielerliste, Votes). Die Aufnahme ist deshalb bewusst auf niedrige Auflösung, kurze Länge (max. 12s) und niedrige Bitrate begrenzt; das Video sieht entsprechend nicht "premium" aus, sondern eher wie eine grobe Webcam-Aufnahme. Falls später doch auf bessere Qualität gewechselt werden soll, braucht es entweder den Blaze-Plan für Storage, oder einen alternativen kostenlosen Dateispeicher (z.B. Cloudinary, das ein kostenloses Kontingent ganz ohne Kreditkarte anbietet).

## Wie der Round-Flow synchronisiert ist

Alle Geräte abonnieren das gleiche Firestore-Dokument (`sessions/{code}`). Der Host startet neue Runden und treibt den Übergang vom Wheel zur Challenge-Phase an; danach reagiert jedes Gerät eigenständig auf Phasenwechsel im Dokument. Die Abstimmung wird von jedem Client geprüft (nicht nur vom Host), damit die Auswertung auch dann passiert, wenn der Host selbst mitstimmt und zufällig zuletzt an der Reihe ist.

## Design-Update

Die erste Fassung war zu bunt (Magenta/Cyan/Amber gleichzeitig im Bild, je Charakter eine eigene Farbe). Überarbeitet auf ein minimalistisches System: ein gedämpfter Akzent (`--color-dare`, dunkles Rot-Magenta) statt mehrerer lauter Farben, Glow-Effekte stark zurückgenommen, Charaktere und Menü-Karten jetzt einheitlich neutral. Die Typografie (Archivo Black für Display, Inter für Body, Space Mono für Zahlen/Codes) wurde beibehalten.

**Bugfix:** Buttons und Inputs hatten in manchen Browsern eine dunkle Default-Textfarbe statt die helle App-Textfarbe zu erben (sichtbar z.B. bei "Host Game" / "Join Game" / "Rules" im Hauptmenü, oder Spielernamen in Lobby/Charakterauswahl). Behoben durch explizites `color: inherit` auf `button`/`input` global, plus explizite Farbangaben an den betroffenen Stellen.

## QR-Code für Lobby-Beitritt

Lobby zeigt jetzt optional einen QR-Code (Button "📷 QR-Code zeigen" neben dem Lobby-Code). Bewusst wird **nur der reine 5-stellige Code** im QR kodiert, keine vollständige URL – sonst würde jede beliebige Kamera-App beim Scannen die Vercel-Domain offenlegen. Im Join-Screen kann man über "📷 QR-Code scannen" die eigene Kamera nutzen; die App erkennt automatisch, sobald ein gültiger Code im Bild ist, und tritt direkt bei. Beide Komponenten (`QrCodeDisplay`, `QrScanner`) laufen rein clientseitig, ohne externen QR-Dienst.

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

Sessions brauchen aktuell **keine** Firestore-Security-Rules-Einschränkung testweise (offener Zugriff), das sollte vor einem öffentlichen Launch noch auf Regeln umgestellt werden (z. B. nur Felder ändern, kein beliebiges Löschen). Ein erster Vorschlag liegt bereits als `firestore.rules` im Projekt – einfach in der Firebase Console unter Firestore Database → Regeln einfügen.

## Design-System

Alle Farben/Schriften/Abstände sind zentral in `src/styles/tokens.css` als CSS-Variablen definiert. Signature-Element ist die kreisförmige "Stage" (`src/components/CircleStage.jsx`), die sich durch Landing Page, später auch Wheel und Lobby zieht.
