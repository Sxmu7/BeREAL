// Challenge-Pool nach Schwierigkeitsgrad, mit Beispielen aus dem Brief
// erweitert. "Chaos"-Challenges können auch Fremde mit einbeziehen
// (siehe Beispiel "decide who gets punished").
export const CHALLENGES = {
  easy: [
    'Finde ein gelbes Auto.',
    'Mach eine Foto-Pose mit einem Fremden.',
    'Bring jemanden zum Lachen, ohne zu sprechen.',
    'Finde jemanden mit dem gleichen Schuhwerk wie du.',
    'Tanze 10 Sekunden lang, ohne Musik.'
  ],
  medium: [
    'Selfie mit jemandem, der eine Sonnenbrille trägt.',
    'Bring jemanden dazu, mit dir anzustoßen.',
    'Finde jemanden, der aus einer anderen Stadt kommt, und frag nach einem Tipp.',
    'Singe die erste Zeile eines Songs vor der Gruppe.',
    'Tausche für eine Runde ein Kleidungsstück mit einem Mitspieler.'
  ],
  hard: [
    'Bring einen Fremden dazu, auf Video "Cheers" zu sagen.',
    'Frag eine fremde Person nach einem Tanz – und führe ihn aus.',
    'Erzähl einem Fremden einen Witz und filme die Reaktion.',
    'Lass dir von einer fremden Person ein Kompliment auf Video geben.',
    'Bestelle etwas auf eine Art, die dich zum Lachen bringt.'
  ],
  chaos: [
    'Lass einen Fremden entscheiden, wer bestraft wird.',
    'Tausche für 2 Runden deinen Charakter-Namen mit einem Mitspieler.',
    'Der Verlierer der letzten Runde wählt deine nächste Challenge.',
    'Lass die Gruppe per Mehrheitsentscheid deine Strafe verdoppeln oder halbieren.',
    'Gib dein Handy für 1 Minute an die Person rechts von dir.'
  ]
}

export function pickRandomChallenge(difficulty) {
  const pool = CHALLENGES[difficulty] || CHALLENGES.medium
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
