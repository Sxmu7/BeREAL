// ============================================================
// Challenge-Pool nach Location-Modus + Schwierigkeitsgrad.
// Jeder Modus hat einen komplett eigenen Aufgaben-Charakter, damit
// die Challenges zur tatsächlichen Umgebung passen (eine Bar-Aufgabe
// "Bestell etwas auf eine lustige Art" ergibt am Hostel keinen Sinn,
// eine Festival-Aufgabe "Finde jemanden mit Glitzer im Gesicht" ergibt
// auf der Hausparty keinen Sinn).
// ============================================================

export const LOCATION_MODES = [
  { id: 'bar', label: 'Bar-Modus', icon: '🍸', desc: 'Bestellungen, Barkeeper, fremde Leute' },
  { id: 'festival', label: 'Festival-Modus', icon: '🎪', desc: 'Crowd, Musik, Tanzen, Chaos' },
  { id: 'hostel', label: 'Hostel-Modus', icon: '🎒', desc: 'Reisende, neue Leute, Gemeinschaftsraum' },
  { id: 'houseparty', label: 'Hausparty-Modus', icon: '🏠', desc: 'Klassiker, Gruppenspiele, vertraute Runde' },
  { id: 'vacation', label: 'Urlaub-Modus', icon: '🏖️', desc: 'Strand, Pool, Sightseeing, Souvenirs' },
]

export function getLocationMode(id) {
  return LOCATION_MODES.find((m) => m.id === id) || LOCATION_MODES[3]
}

export const CHALLENGES_BY_LOCATION = {

  // ── BAR ──
  bar: {
    easy: [
      'Bestell einen Drink mit einem Fantasienamen.',
      'Frag den Barkeeper nach seinem besten Trick.',
      'Finde jemanden, der das gleiche trinkt wie du.',
      'Stoß mit drei verschiedenen Personen an.',
      'Tausch deinen Barhocker für eine Runde.'
    ],
    medium: [
      'Bestell auf eine Art, die dich zum Lachen bringt.',
      'Frag eine fremde Person an der Bar nach einer Drink-Empfehlung.',
      'Bring den Barkeeper zum Lächeln – ohne ein Wort zu sagen.',
      'Finde jemanden mit einem Cocktail und beschreib, wie er wohl schmeckt.',
      'Lass dir von jemand Fremdem dein Lieblingsgetränk vorschlagen.'
    ],
    hard: [
      'Bring einen Fremden dazu, mit dir auf Video "Cheers" zu sagen.',
      'Frag den Barkeeper nach der peinlichsten Bestellung des Abends.',
      'Lass dir von einer fremden Person ein Kompliment auf Video geben.',
      'Tausch für eine Runde deinen Platz mit jemand Fremdem an der Bar.',
      'Erzähl der Bar-Crowd einen Witz und filme die Reaktion.'
    ],
    chaos: [
      'Lass den Barkeeper deinen nächsten Drink aussuchen – Augen zu.',
      'Eine fremde Person an der Bar entscheidet, wer als Nächstes bestraft wird.',
      'Tausch für 2 Runden deinen Namen mit der Person neben dir an der Bar.',
      'Lass die Gruppe entscheiden: dein nächster Drink wird mit etwas gemischt.',
      'Frag drei Fremde nacheinander nach ihrem peinlichsten Bar-Moment.'
    ]
  },

  // ── FESTIVAL ──
  festival: {
    easy: [
      'Finde jemanden mit Glitzer im Gesicht.',
      'Tanze 15 Sekunden lang zur Musik um dich herum.',
      'Finde ein Outfit in deiner Lieblingsfarbe in der Crowd.',
      'Mach mit drei Fremden eine Gruppen-Pose.',
      'Bring jemanden dazu, mit dir mitzusingen.'
    ],
    medium: [
      'Lerne den Tanzmove der Person neben dir und mach ihn nach.',
      'Finde jemanden mit Face-Paint und frag, wer es gemalt hat.',
      'Starte eine Welle mit mindestens 5 Leuten um dich herum.',
      'Tausch für eine Stunde Armbänder mit jemand Fremdem.',
      'Bring eine fremde Gruppe dazu, mit dir zu jubeln.'
    ],
    hard: [
      'Bring eine komplett fremde Gruppe dazu, ein Foto mit dir zu machen.',
      'Lerne in 2 Minuten den Namen von 3 Fremden und stell sie der Gruppe vor.',
      'Starte einen Tanz-Circle und bring 5 Leute zum Mitmachen.',
      'Frag jemand Fremdes nach seinem besten Festival-Erlebnis – auf Video.',
      'Bring die Crowd um dich herum dazu, deinen Namen zu rufen.'
    ],
    chaos: [
      'Eine fremde Person aus der Crowd entscheidet, wer bestraft wird.',
      'Tausch für 2 Runden ein Kleidungsstück mit jemand Fremdem.',
      'Lass dir von der Gruppe um dich herum eine Mini-Choreo beibringen.',
      'Der lauteste Fremde in deiner Nähe wählt deine nächste Challenge.',
      'Sammle High-Fives von 10 Fremden in 60 Sekunden.'
    ]
  },

  // ── HOSTEL ──
  hostel: {
    easy: [
      'Frag jemanden im Gemeinschaftsraum, woher er kommt.',
      'Finde jemanden, der aus einem anderen Land kommt als du.',
      'Tausch ein Reise-Tipp mit einem Fremden im Hostel.',
      'Finde jemanden mit dem gleichen Rucksack-Typ wie du.',
      'Stell dich drei Leuten im Gemeinschaftsraum vor.'
    ],
    medium: [
      'Frag einen Fremden nach seinem besten Reise-Tipp und teil ihn mit der Gruppe.',
      'Lerne ein Wort in der Sprache eines Mitreisenden und benutz es.',
      'Finde jemanden, der schon am Ort war, wo du als Nächstes hinwillst.',
      'Bring jemanden aus einem anderen Zimmer dazu, mit euch anzustoßen.',
      'Tausch für eine Stunde ein Kleidungsstück mit jemand aus deinem Dorm.'
    ],
    hard: [
      'Frag einen Fremden im Hostel nach seiner verrücktesten Reise-Geschichte – auf Video.',
      'Bring jemanden aus einem anderen Land dazu, ein Wort in seiner Sprache zu lehren – auf Video.',
      'Organisier ein Mini-Spiel mit 3 Fremden aus dem Gemeinschaftsraum.',
      'Lass dir von einem Mitreisenden sein bestes Foto vom Trip zeigen und erklären.',
      'Bring 3 Personen aus verschiedenen Ländern zusammen für ein Gruppenfoto.'
    ],
    chaos: [
      'Eine fremde Person aus deinem Dorm entscheidet, wer bestraft wird.',
      'Tausch für den Rest des Abends deinen Vornamen mit jemand Fremdem.',
      'Lass dir spontan einen Spitznamen von jemand Fremdem geben – und benutz ihn.',
      'Der am weitesten gereiste Fremde im Raum wählt deine nächste Challenge.',
      'Frag 3 Fremde nacheinander: "Was ist dein peinlichster Reise-Moment?"'
    ]
  },

  // ── HAUSPARTY ──
  houseparty: {
    easy: [
      'Finde etwas Gelbes im Raum und bring es zur Gruppe.',
      'Mach eine Foto-Pose mit der Person rechts von dir.',
      'Bring jemanden zum Lachen, ohne zu sprechen.',
      'Tanze 10 Sekunden lang ohne Musik.',
      'Finde jemanden mit dem gleichen Schuhwerk wie du.'
    ],
    medium: [
      'Singe die erste Zeile eines Songs vor der Gruppe.',
      'Tausch für eine Runde ein Kleidungsstück mit einem Mitspieler.',
      'Imitiere einen anderen Spieler, bis die Gruppe errät, wer es ist.',
      'Erzähl die peinlichste Geschichte, die dir gerade einfällt.',
      'Bring jemanden dazu, mit dir auf einen Spruch anzustoßen, den du erfindest.'
    ],
    hard: [
      'Erzähl einem Mitspieler einen Witz und film die Reaktion.',
      'Lass dir von der Gruppe ein Kompliment auf Video geben.',
      'Tausch für 2 Runden deinen Sitzplatz mit einem zufällig gewählten Spieler.',
      'Mach eine Mini-Performance (Tanz, Gesang, Schauspiel) für die Gruppe.',
      "Verrate dein peinlichstes Party-Erlebnis – die Gruppe stimmt ab, ob sie's glaubt."
    ],
    chaos: [
      'Die Gruppe entscheidet per Mehrheit, wer als Nächstes bestraft wird.',
      'Tausch für 2 Runden deinen Charakter-Namen mit einem Mitspieler.',
      'Der Verlierer der letzten Runde wählt deine nächste Challenge.',
      'Gib dein Handy für 1 Minute an die Person rechts von dir.',
      'Lass die Gruppe per Mehrheitsentscheid deine Strafe verdoppeln oder halbieren.'
    ]
  },

  // ── URLAUB ──
  vacation: {
    easy: [
      'Finde etwas in der Farbe des Meeres/Pools in der Nähe.',
      'Mach eine Urlaubs-Pose für ein Foto.',
      'Finde jemanden mit Sonnenbrille und frag nach einem Foto.',
      'Bau in 30 Sekunden etwas aus Sand oder was greifbar ist.',
      'Bring jemanden dazu, "Prost auf den Urlaub" zu sagen.'
    ],
    medium: [
      'Frag jemand Fremdes am Pool/Strand nach einem Insider-Tipp für die Gegend.',
      'Mach ein Urlaubsfoto mit einem kompletten Fremden.',
      "Bestell etwas auf Landessprache (oder versuch's zumindest).",
      'Finde jemanden, der schon mal an deinem Heimatort war.',
      'Tausch für eine Stunde deine Sonnenbrille mit jemandem aus der Gruppe.'
    ],
    hard: [
      'Frag einen Local nach seinem besten Geheimtipp – auf Video.',
      'Bring einen Fremden dazu, ein Wort in seiner Sprache zu lehren – auf Video.',
      'Organisier ein Spontan-Wettrennen (Pool, Strand, Flur) mit 2 Mitspielern.',
      'Lass dir von einem Fremden ein Souvenir-Empfehlung geben und erklären, warum.',
      'Mach mit einer fremden Reisegruppe ein gemeinsames Gruppenfoto.'
    ],
    chaos: [
      'Eine fremde Person am Pool/Strand entscheidet, wer bestraft wird.',
      'Tausch für 2 Runden deinen Namen mit der Person neben dir.',
      'Der Verlierer der letzten Runde wählt dein nächstes Urlaubsfoto-Motiv.',
      'Lass die Gruppe entscheiden, was du als Nächstes bestellst.',
      'Frag 3 Fremde nacheinander nach ihrem besten Urlaubsmoment – auf Video.'
    ]
  }
}

/**
 * Wählt eine zufällige Challenge passend zu Location-Modus und
 * Schwierigkeit. Fällt auf den Hausparty-Pool zurück, falls ein
 * unbekannter Modus übergeben wird (z.B. bei alten gespeicherten
 * Sessions ohne locationMode-Feld).
 */
export function pickRandomChallenge(difficulty, locationMode = 'houseparty') {
  const locationPool = CHALLENGES_BY_LOCATION[locationMode] || CHALLENGES_BY_LOCATION.houseparty
  const pool = locationPool[difficulty] || locationPool.medium
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickRandomPlayer(players, excludeIds = []) {
  const eligible = players.filter((p) => !excludeIds.includes(p.id))
  const pool = eligible.length > 0 ? eligible : players
  return pool[Math.floor(Math.random() * pool.length)]
}

// Strafen-Skalierung nach Getränk, wie im Brief beschrieben.
export const PUNISHMENT_BY_DRINK = {
  beer: { mild: '1 Schluck', medium: '2 Schlucke', heavy: '4 Schlucke' },
  wine: { mild: '1 Schluck', medium: '2 Schlucke', heavy: '3 Schlucke' },
  cocktail: { mild: '1 Schluck', medium: '1 Schluck', heavy: '2 Schlucke' },
  shot: { mild: '⅛ Shot', medium: '¼ Shot', heavy: '½ Shot' },
  soft: { mild: '1 Schluck', medium: '2 Schlucke', heavy: '3 Schlucke' },
  water: { mild: '1 Schluck', medium: '2 Schlucke', heavy: '3 Schlucke' }
}

export const DRINK_OPTIONS = [
  { id: 'beer', label: 'Bier', icon: '🍺' },
  { id: 'wine', label: 'Wein', icon: '🍷' },
  { id: 'cocktail', label: 'Cocktail', icon: '🍹' },
  { id: 'shot', label: 'Shot', icon: '🥃' },
  { id: 'soft', label: 'Softdrink', icon: '🥤' },
  { id: 'water', label: 'Wasser', icon: '💧' }
]

// Casual-Mode Strafen: keine Getränke, sondern Punktabzug/Penalties.
export const CASUAL_PUNISHMENTS = {
  mild: '−5 Punkte',
  medium: '−10 Punkte, Challenge-Streak verloren',
  heavy: '−20 Punkte, Challenge-Streak verloren'
}

export function getPunishmentLabel({ gameMode, drink, punishmentLevel }) {
  if (gameMode === 'casual') {
    return CASUAL_PUNISHMENTS[punishmentLevel] || CASUAL_PUNISHMENTS.medium
  }
  const drinkTable = PUNISHMENT_BY_DRINK[drink] || PUNISHMENT_BY_DRINK.soft
  return drinkTable[punishmentLevel] || drinkTable.medium
}
