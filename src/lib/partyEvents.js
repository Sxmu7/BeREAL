/**
 * Party-Events: seltene Zufallsereignisse statt einer normalen
 * Challenge-Runde (Brief: "Selten aber überraschend"). Jedes Event
 * hat einen Titel, eine kurze Erklärung und einen `effect`-Schlüssel,
 * den GameScreen interpretiert (z.B. um doppelte Punkte zu vergeben
 * oder alle statt nur einer Person aufzufordern).
 */
export const PARTY_EVENTS = [
  {
    key: 'all_drink',
    title: 'Alle trinken!',
    icon: '🍻',
    description: 'Diese Runde nimmt jeder einen Schluck – keine Challenge nötig.',
    effect: 'all_drink'
  },
  {
    key: 'double_points',
    title: 'Doppelte Punkte',
    icon: '✨',
    description: 'Wer diese Challenge schafft, bekommt doppelte Punkte.',
    effect: 'double_points'
  },
  {
    key: 'reverse_round',
    title: 'Reverse Round',
    icon: '🔄',
    description: 'Diesmal entscheidet die Gruppe, wer die Challenge bekommt.',
    effect: 'reverse_round'
  },
  {
    key: 'everyone_vs_everyone',
    title: 'Jeder gegen Jeden',
    icon: '⚔️',
    description: 'Alle bekommen dieselbe Challenge gleichzeitig.',
    effect: 'battle_round'
  },
  {
    key: 'last_one_drinks',
    title: 'Der Letzte trinkt',
    icon: '🐢',
    description: 'Wer die Challenge zuletzt abschließt, nimmt einen Schluck extra.',
    effect: 'last_one_drinks'
  }
]

const PARTY_EVENT_CHANCE = 0.18 // ~1 von 5-6 Runden, "selten aber überraschend"

/**
 * Entscheidet, ob die kommende Runde ein Party-Event wird, und wenn
 * ja, welches. Wird vom Host beim Rundenstart aufgerufen. Gibt null
 * zurück für eine normale Runde.
 */
export function maybePickPartyEvent(roundNumber) {
  // Erste Runde nie als Event, damit der Einstieg ins Spiel normal bleibt.
  if (roundNumber <= 1) return null
  if (Math.random() > PARTY_EVENT_CHANCE) return null
  return PARTY_EVENTS[Math.floor(Math.random() * PARTY_EVENTS.length)]
}
