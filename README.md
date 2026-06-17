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
| Voting-Timer (30s) mit Auto-Auswertung | ✅ fertig |
| Punktestand/Scoreboard nach jeder Runde | ✅ fertig |
| Vollbild-Timer mit Zeichenanimation + rote Warnfarbe | ✅ fertig |
| Push-Notifications (FCM) | 🔧 vorbereitet, braucht deine Console-Einrichtung |

## Video-Proof ohne Firebase Storage (kein Blaze-Plan nötig)

Ursprünglich war geplant, Beweisvideos zu Firebase Storage hochzuladen. Storage verlangt bei diesem Projekt aber den kostenpflichtigen Blaze-Plan schon zum Einrichten (auch wenn man am Ende im kostenlosen Kontingent bleibt) – das wolltest du nicht. Stattdessen läuft es jetzt so: Das Video wird mit niedriger Auflösung/Bitrate aufgenommen, als Base64-Text direkt ins Firestore-Round-Dokument geschrieben (`currentRound.proofUrl`), und beim Start der nächsten Runde automatisch wieder auf `null` gesetzt – passend zu "Videos and photos are TEMPORARY" aus dem Brief, nur eben über Firestore statt Storage gelöst.

Wichtige Einschränkung: Firestore erlaubt maximal 1 MB pro Dokument, inklusive aller anderen Felder (Settings, Spielerliste, Votes). Die Aufnahme ist deshalb bewusst auf niedrige Auflösung, kurze Länge (max. 12s) und niedrige Bitrate begrenzt; das Video sieht entsprechend nicht "premium" aus, sondern eher wie eine grobe Webcam-Aufnahme. Falls später doch auf bessere Qualität gewechselt werden soll, braucht es entweder den Blaze-Plan für Storage, oder einen alternativen kostenlosen Dateispeicher (z.B. Cloudinary, das ein kostenloses Kontingent ganz ohne Kreditkarte anbietet).

## Wie der Round-Flow synchronisiert ist

Alle Geräte abonnieren das gleiche Firestore-Dokument (`sessions/{code}`). Der Host startet neue Runden und treibt den Übergang vom Wheel zur Challenge-Phase an; danach reagiert jedes Gerät eigenständig auf Phasenwechsel im Dokument. Die Abstimmung wird von jedem Client geprüft (nicht nur vom Host), damit die Auswertung auch dann passiert, wenn der Host selbst mitstimmt und zufällig zuletzt an der Reihe ist.

## Design-Update: Apple-Stil mit Light/Dark Mode

Die App wurde komplett auf eine zurückhaltende Apple-Ästhetik umgestellt: Weiß, Space Grau (`#1d1d1f`) und Apples charakteristisches Hellgrau (`#f5f5f7`) als Flächenfarben, ein einziger Akzent (Apple System-Blau, `#0071e3` im Light Mode / `#0a84ff` im Dark Mode) statt mehrerer Farben gleichzeitig. Glasmorphismus (Backdrop-Blur, transluzente Flächen) wurde durch klare Karten mit dezentem Schatten ersetzt – passend zu Apples eigenem Look, der auf klare Flächen statt Transparenz setzt. Die Typografie läuft jetzt über die native System-Schriftart (`-apple-system`, was auf Apple-Geräten automatisch SF Pro nutzt, mit Inter als Fallback auf anderen Plattformen) statt der vorherigen Archivo Black.

**Light/Dark Mode:** Jeder Screen hat einen Toggle-Button (Sonne/Mond-Symbol), der zwischen Light und Dark Mode wechselt. Beim ersten Besuch wird automatisch die System-Präferenz übernommen, danach merkt sich die App die explizite Wahl in `localStorage`. Technisch laufen beide Modi komplett über CSS-Variablen in `src/styles/tokens.css`: ein `data-theme="dark"`-Attribut am `<html>`-Element schaltet zwischen zwei Variablen-Sets um (`src/lib/useTheme.js` verwaltet das). Es gibt keinen doppelten Code für beide Modi – jede Komponente nutzt dieselben Variablennamen, nur deren Werte ändern sich.

**Animierte Hintergrundpunkte:** Auf den meisten Screens schwebt im Hintergrund eine dezente Schicht aus wenigen, langsam treibenden Punkten (`src/components/FloatingDots.jsx`), bewusst sparsam und unaufdringlich gehalten, damit der Inhalt im Vordergrund bleibt.

**Bugfix:** Buttons und Inputs hatten in manchen Browsern eine dunkle Default-Textfarbe statt die App-Textfarbe zu erben (sichtbar z.B. bei "Host Game" / "Join Game" / "Rules" im Hauptmenü, oder Spielernamen in Lobby/Charakterauswahl). Behoben durch explizites `color: inherit` auf `button`/`input` global, plus explizite Farbangaben an den betroffenen Stellen.

## QR-Code für Lobby-Beitritt

Lobby zeigt jetzt optional einen QR-Code (Button "📷 QR-Code zeigen" neben dem Lobby-Code). Bewusst wird **nur der reine 5-stellige Code** im QR kodiert, keine vollständige URL – sonst würde jede beliebige Kamera-App beim Scannen die Vercel-Domain offenlegen. Im Join-Screen kann man über "📷 QR-Code scannen" die eigene Kamera nutzen; die App erkennt automatisch, sobald ein gültiger Code im Bild ist, und tritt direkt bei. Beide Komponenten (`QrCodeDisplay`, `QrScanner`) laufen rein clientseitig, ohne externen QR-Dienst.

## Timer & Voting-Verbesserungen

Jeder Timer (Challenge-Entscheidung, Abstimmung) zeigt jetzt beim Start kurz ein Vollbild-Moment: ein Kreis zeichnet sich groß und zentral auf (`FullscreenTimer.jsx`), danach zieht er sich auf eine kompakte Position oben rechts zusammen, damit die Annahme-/Voting-Buttons darunter weiter bedienbar bleiben. Bei wenig Restzeit (≤10s) färbt sich die Zeitanzeige rot und pulsiert leicht.

Die Abstimmung hat jetzt ein eigenes 30-Sekunden-Zeitlimit. Läuft die Zeit ab, ohne dass alle abgestimmt haben, wird automatisch mit den bis dahin abgegebenen Stimmen ausgewertet (niemand abgestimmt → zählt als nicht geschafft). Während der Abstimmung zeigt eine Fortschrittsleiste live, wie viele der stimmberechtigten Spieler schon abgestimmt haben.

Der Ergebnis-Screen nach jeder Runde zeigt jetzt zusätzlich ein animiertes Scoreboard mit dem aktuellen Punktestand aller Spieler (sortiert nach Siegen), nicht nur das Resultat der gerade gespielten Runde.

**Bugfix Wheel-Animation:** Die Drehanimation des Wheels hatte kein explizites `initial`-Prop für die Rotation, wodurch Framer Motion in manchen Fällen direkt zum Endwert sprang statt sichtbar zu drehen. Behoben, plus die Animation insgesamt deutlicher gemacht (6 Umdrehungen statt 4, etwas länger).

**Bugfix Spieler-Wiederholung:** Die Zufallsauswahl des nächsten Spielers schloss den zuvor ausgewählten Spieler nicht aus, wodurch bei kleinen Gruppen oft direkt wieder dieselbe Person dran war. Jetzt wird der vorherige Spieler von der nächsten Auswahl ausgeschlossen (außer es gibt nur einen Spieler).

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

Alle Farben/Schriften/Abstände sind zentral in `src/styles/tokens.css` als CSS-Variablen definiert, getrennt nach Light Mode (Standardwerte in `:root`) und Dark Mode (Überschreibungen in `[data-theme='dark']`). Komponenten verwenden ausschließlich die Variablennamen (`var(--color-bg)`, `var(--color-text-primary)`, etc.), nie feste Farbwerte – dadurch funktioniert der Theme-Wechsel automatisch überall, ohne dass einzelne Komponenten Light/Dark-Sonderfälle behandeln müssen. Ausnahmen sind bewusst: Elemente, die immer auf einem echten Kamera-Live-Bild liegen (QR-Scanner-Overlay, Aufnahme-Badge beim Video-Proof), behalten feste helle/dunkle Werte, weil sie unabhängig vom App-Theme auf dunklem Kamerabild sitzen.

Signature-Element ist die kreisförmige "Stage" (`src/components/CircleStage.jsx`), die sich durch Landing Page, Wheel und Lobby zieht.
