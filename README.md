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
| Battle Rounds (alle bekommen gleiche Challenge) | ⏳ offen (Party-Event "Jeder gegen Jeden" zeigt nur an, vergibt aber noch keine echte Battle-Round-Logik) |
| Party-Recap am Session-Ende | ✅ fertig |
| Voting-Timer (30s) mit Auto-Auswertung | ✅ fertig |
| Punktestand/Scoreboard nach jeder Runde | ✅ fertig |
| Vollbild-Timer mit Zeichenanimation + rote Warnfarbe | ✅ fertig |
| Push-Notifications (FCM) | 🔧 vorbereitet, braucht deine Console-Einrichtung |
| Letztes Spiel fortsetzen | ✅ fertig |
| Wiederkehrer-Begrüßung mit Namen | ✅ fertig |
| Spielerprofil & lebenslange lokale Statistiken | ✅ fertig |
| Awards-System (MVP, Alkoholiker, Mutigster, Glückspilz, Chaos-Master) | ✅ fertig |
| Party-Replay ("Euer Abend in Zahlen") | ✅ fertig |
| Runden-Spannung (Spielerbilder + 3-2-1-Countdown) | ✅ fertig |
| Live-Ranking während des Spiels | ✅ fertig |
| Party-Events (zufällige Sonderrunden) | ✅ fertig (3 von 5 Effekten vollständig wirksam, siehe unten) |
| Sound- & Haptik-Grundgerüst | ✅ fertig (synthetische Sounds, kein Audio-Dateien-Download nötig) |
| Konfetti bei Erfolg | ✅ fertig |

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

## UX-Überarbeitung: Profil, Awards, Party-Replay, Spannung, Events, Sound

Großes Update mit mehreren neuen Systemen, die zusammen das "professionelle Party-App"-Gefühl aus dem Brief unterstützen sollen.

**Letztes Spiel fortsetzen** (`src/lib/lastSession.js`): Der Code der zuletzt betretenen/erstellten Session wird in `localStorage` gemerkt. Beim Öffnen der Landing Page wird einmalig geprüft, ob diese Session noch existiert und nicht beendet ist – falls ja, erscheint ein Banner mit "▶ Spiel fortsetzen" / "✕ Neues Spiel starten". Damit das Banner nach einem regulär beendeten Spiel auch wieder verschwindet, gibt es jetzt im Result-Screen einen neuen "Spiel beenden"-Button für den Host (`endSession` setzt `status: 'ended'` in Firestore), der vorher komplett fehlte.

**Wiederkehrer-Begrüßung:** Die Landing Page zeigt bei vorhandenem gespeichertem Namen "🍻 Schön, dass du wieder da bist, [Name]" statt des Standard-Taglines, und der Start-Button führt direkt ins Hauptmenü statt erneut zur Namenseingabe.

**Lokale Statistiken** (`src/lib/localStats.js`) sind bewusst getrennt von den Firestore-`stats`, die nur innerhalb einer einzelnen Session existieren und fürs Live-Scoreboard gebraucht werden. Die lokalen Statistiken sind lebenslang (über alle Sessions hinweg) und werden im neuen `/profile`-Screen angezeigt: Spiele gespielt, Challenges geschafft/verloren, verteilte/getrunkene Schlücke, Siege, MVP-Auszeichnungen. Im Hauptmenü gibt es dafür jetzt einen kleinen "Statistiken"-Eintrag neben "Spielregeln", wie im Brief beschrieben ("darunter kleiner").

**Awards** (`src/lib/awards.js`) werden aus den Session-`stats` aller Spieler berechnet: MVP (meiste Siege), Alkoholiker des Abends (meiste Strafen), Mutigster Spieler (meiste angenommene Challenges), Glückspilz (höchste Erfolgsquote), Chaos-Master (meiste Battle-Round-Siege). Der "Verräter"-Award aus dem Brief fehlt bewusst, da dafür getrackt werden müsste, wer wie abgestimmt hat – aktuell wird nur das Endergebnis der Abstimmung gespeichert, nicht die einzelnen Stimmen pro Person. Lässt sich nachrüsten, sobald das gewünscht ist.

**Party-Replay** (`/recap/:code`, `src/pages/RecapScreen.jsx`): Neuer Abschluss-Screen "🍻 Euer Abend in Zahlen" mit Spieldauer, Spieleranzahl, Rundenzahl, Gesamt-Challenges, Gewinner und allen Awards. Schreibt beim ersten Aufruf einmalig die lokalen Statistiken fort (geschützt gegen Doppelzählung bei Seiten-Reload). Die Session-Daten werden per Navigations-State vom GameScreen übergeben statt erneut aus Firestore geladen, um eine Race Condition direkt nach `endSession` zu vermeiden.

**Runden-Spannung** (`src/components/RoundCountdown.jsx`): Neue `'countdown'`-Rundenphase zwischen Ergebnis und Wheel-Spin. Zeigt zuerst kurz alle Spielerbilder, dann läuft ein 3-2-1-Countdown (mit Sound + Vibration pro Zahl), bevor das Wheel zu drehen beginnt. Server-seitig steht der nächste Spieler/Challenge dabei schon fest (für synchrone Ergebnisse), wird aber erst nach dem Countdown für alle sichtbar.

**Live-Ranking** (`src/components/LiveRanking.jsx`): Kompakter Button im Spiel-Header (zeigt den aktuellen Spitzenreiter), der per Tap eine kleine Rangliste mit Medaillen ausklappt. Bewusst nicht permanent sichtbar, um den Bildschirm nicht zu überladen.

**Party-Events** (`src/lib/partyEvents.js`): Ab Runde 2 besteht eine ~18%-Chance, dass statt einer normalen Challenge ein Sonderereignis ausgelost wird, angezeigt über einen auffälligen "⚠️ PARTY EVENT"-Banner. Von den fünf Event-Typen sind drei vollständig wirksam: **Alle trinken** (überspringt die Challenge komplett, direkter "Weiter"-Button für den Host), **Doppelte Punkte** (verdoppelt bei Erfolg die vergebenen Punkte über `pointsMultiplier` in `finalizeRound`), **Der Letzte trinkt** (wird angezeigt, Auswertung "wer war zuletzt fertig" ist aktuell manuell/sozial zu handhaben). **Reverse Round** und **Jeder gegen Jeden** werden angezeigt, greifen aber noch nicht automatisch in die Spielerauswahl-Logik ein – eine echte Battle-Round-Mechanik (alle bekommen dieselbe Challenge parallel) würde eine grundlegend andere Rundenstruktur brauchen als das aktuelle "eine Person pro Runde"-Modell und ist als eigenes, größeres Feature zu verstehen.

**Sound & Haptik** (`src/lib/sounds.js`): Töne werden synthetisch über die Web Audio API erzeugt (Sinus-/Sägezahn-/Rechteck-Wellen für Karten-, Erfolgs-, Fehler- und Countdown-Sounds) statt aus externen Audio-Dateien geladen – funktioniert ohne zusätzliche Assets oder Ladezeit, was auf einer Party mit wechselndem Empfang praktisch ist. Wer "echte" aufgenommene Sounds möchte, kann die `playTone()`-Aufrufe in `sounds.js` durch `new Audio('/sounds/x.mp3').play()` ersetzen. Vibration läuft über die Vibration-API (nur Android Chrome, iOS Safari unterstützt das aktuell nicht – Aufrufe sind aber mit Feature-Check abgesichert und tun auf iOS einfach nichts). Ein Ein/Aus-Schalter dafür liegt im `/profile`-Screen.

**Konfetti** (`src/components/Confetti.jsx`): Leichtgewichtiger, rein CSS/Framer-Motion-basierter Effekt (keine externe Bibliothek), läuft bei jedem geschafften Challenge-Erfolg im Result-Screen und beim Öffnen des Party-Replay-Screens.
