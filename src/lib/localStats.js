const STORAGE_KEY = 'daredrop_local_stats'

/**
 * Lebenslange, rein lokale Statistiken (über alle Sessions hinweg),
 * getrennt von den Firestore-`stats`, die nur innerhalb einer
 * einzelnen Session existieren und fürs Live-Scoreboard gebraucht
 * werden. Diese hier werden einmal pro beendetem Spiel aktualisiert
 * und bilden die Grundlage für Profil-Anzeige und Awards-Berechnung.
 */
function emptyLocalStats() {
  return {
    gamesPlayed: 0,
    challengesCompleted: 0,
    challengesFailed: 0,
    sipsGiven: 0,
    sipsTaken: 0,
    wins: 0,
    mvpAwards: 0
  }
}

export function readLocalStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyLocalStats()
    return { ...emptyLocalStats(), ...JSON.parse(raw) }
  } catch {
    return emptyLocalStats()
  }
}

function writeLocalStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage evtl. nicht verfügbar, dann verzichten wir auf Persistenz
  }
  return stats
}

/**
 * Rechnet das Ergebnis eines beendeten Spiels in die lebenslangen
 * lokalen Statistiken ein. `delta` enthält nur die Werte aus genau
 * dieser einen Session (nicht den kumulierten Gesamtstand).
 */
export function recordGameResult(delta) {
  const current = readLocalStats()
  const next = {
    gamesPlayed: current.gamesPlayed + 1,
    challengesCompleted: current.challengesCompleted + (delta.challengesCompleted || 0),
    challengesFailed: current.challengesFailed + (delta.challengesFailed || 0),
    sipsGiven: current.sipsGiven + (delta.sipsGiven || 0),
    sipsTaken: current.sipsTaken + (delta.sipsTaken || 0),
    wins: current.wins + (delta.won ? 1 : 0),
    mvpAwards: current.mvpAwards + (delta.wasMvp ? 1 : 0)
  }
  return writeLocalStats(next)
}

export function resetLocalStats() {
  return writeLocalStats(emptyLocalStats())
}
