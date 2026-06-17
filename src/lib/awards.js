/**
 * Berechnet die Awards am Spielende aus den Session-`stats` (siehe
 * rounds.js: { wins, losses, completed, failed, punishments,
 * battleWins } pro Spieler-ID). Jeder Award geht an genau eine
 * Person; bei Gleichstand entscheidet die Reihenfolge in der
 * Spielerliste (deterministisch, kein Zufall nötig, da es ohnehin
 * nur kosmetisch ist).
 *
 * Definitionen, angelehnt an den Brief:
 * - MVP: meiste Siege (gewonnene Challenges)
 * - Alkoholiker des Abends: meiste Strafen genommen (punishments)
 * - Glückspilz: höchste Erfolgsquote bei mindestens einer Challenge
 * - Mutigster Spieler: meiste angenommene Challenges insgesamt
 *   (completed + failed, also Risikobereitschaft unabhängig vom Ausgang)
 * - Chaos-Master: meiste Battle-Round-Siege
 * - Verräter: meiste negative Stimmen abgegeben – dafür fehlen uns
 *   aktuell Rohdaten (wir zählen nur das Endergebnis, nicht wer wie
 *   gevotet hat), daher lassen wir diesen Award vorerst aus und
 *   ergänzen ihn, sobald Voting-Verlauf pro Spieler getrackt wird.
 */

function pickByHighest(players, statsByPlayer, selector) {
  let best = null
  let bestValue = -Infinity
  for (const p of players) {
    const value = selector(statsByPlayer[p.id] || {})
    if (value > bestValue) {
      bestValue = value
      best = p
    }
  }
  return bestValue > 0 ? best : null
}

export function calculateAwards(players, statsByPlayer) {
  const awards = []

  const mvp = pickByHighest(players, statsByPlayer, (s) => s.wins || 0)
  if (mvp) awards.push({ key: 'mvp', title: 'MVP', icon: '🏆', playerId: mvp.id, playerName: mvp.name })

  const alcoholic = pickByHighest(players, statsByPlayer, (s) => s.punishments || 0)
  if (alcoholic) {
    awards.push({
      key: 'alcoholic',
      title: 'Alkoholiker des Abends',
      icon: '🍺',
      playerId: alcoholic.id,
      playerName: alcoholic.name
    })
  }

  const bravest = pickByHighest(
    players,
    statsByPlayer,
    (s) => (s.completed || 0) + (s.failed || 0)
  )
  if (bravest) {
    awards.push({
      key: 'bravest',
      title: 'Mutigster Spieler',
      icon: '🔥',
      playerId: bravest.id,
      playerName: bravest.name
    })
  }

  const luckyOne = pickByHighest(players, statsByPlayer, (s) => {
    const attempts = (s.completed || 0) + (s.failed || 0)
    if (attempts === 0) return 0
    // Erfolgsquote, leicht gewichtet nach Anzahl Versuchen, damit ein
    // einziger Glückstreffer nicht automatisch gewinnt.
    return (s.completed / attempts) * Math.min(attempts, 3)
  })
  if (luckyOne) {
    awards.push({
      key: 'lucky',
      title: 'Glückspilz',
      icon: '🍀',
      playerId: luckyOne.id,
      playerName: luckyOne.name
    })
  }

  const chaosMaster = pickByHighest(players, statsByPlayer, (s) => s.battleWins || 0)
  if (chaosMaster) {
    awards.push({
      key: 'chaos',
      title: 'Chaos-Master',
      icon: '🌀',
      playerId: chaosMaster.id,
      playerName: chaosMaster.name
    })
  }

  return awards
}
