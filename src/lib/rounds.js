import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { pickRandomChallenge, pickRandomPlayer } from './challenges'

/**
 * Erweiterung der Firestore-Struktur um die aktive Runde:
 *
 * sessions/{sessionCode}
 *   ...
 *   currentRound: {
 *     roundNumber: number
 *     phase: 'spinning' | 'challenge' | 'recording' | 'voting' | 'result'
 *     selectedPlayerId: string
 *     challengeText: string
 *     difficulty: string
 *     decision: 'pending' | 'accepted' | 'punishment'
 *     proofUrl: string | null
 *     votes: { [playerId]: 'yes' | 'no' }
 *     outcome: 'success' | 'failed' | 'punished' | null
 *     startedAt: serverTimestamp
 *   } | null
 *   stats: {
 *     [playerId]: { wins, losses, completed, failed, punishments, battleWins }
 *   }
 */

function emptyStats() {
  return { wins: 0, losses: 0, completed: 0, failed: 0, punishments: 0, battleWins: 0 }
}

export function ensurePlayerStats(stats, playerId) {
  return stats?.[playerId] || emptyStats()
}

/**
 * Startet eine neue Runde: wählt zufällig einen Spieler und eine
 * Challenge passend zur eingestellten Schwierigkeit. Phase startet
 * bei 'spinning', damit alle Geräte die gleiche Wheel-Animation zeigen
 * (Server bestimmt das Ergebnis, das Wheel ist rein visuell).
 */
export async function startNewRound(
  sessionCode,
  { players, difficulty, roundNumber, previousSelectedPlayerId }
) {
  // Der zuletzt ausgewählte Spieler wird ausgeschlossen, damit nicht
  // wiederholt dieselbe Person dran ist – bei kleinen Gruppen würde
  // reiner Zufall ohne diesen Ausschluss schnell wie ein Bug wirken,
  // auch wenn es technisch korrekter Zufall wäre.
  const excludeIds = previousSelectedPlayerId ? [previousSelectedPlayerId] : []
  const selected = pickRandomPlayer(players, excludeIds)
  const challengeText = pickRandomChallenge(difficulty)

  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, {
    currentRound: {
      roundNumber,
      phase: 'spinning',
      selectedPlayerId: selected.id,
      challengeText,
      difficulty,
      decision: 'pending',
      proofUrl: null,
      votes: {},
      outcome: null,
      startedAt: serverTimestamp()
    }
  })
}

export async function advanceRoundPhase(sessionCode, phase) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { 'currentRound.phase': phase })
}

export async function setRoundDecision(sessionCode, decision) {
  const ref = doc(db, 'sessions', sessionCode)
  const nextPhase = decision === 'accepted' ? 'recording' : 'result'
  await updateDoc(ref, {
    'currentRound.decision': decision,
    'currentRound.phase': nextPhase,
    ...(decision === 'punishment' ? { 'currentRound.outcome': 'punished' } : {})
  })
}

export async function submitProof(sessionCode, proofUrl) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, {
    'currentRound.proofUrl': proofUrl,
    'currentRound.phase': 'voting'
  })
}

export async function castVote(sessionCode, currentVotes, voterId, vote) {
  const ref = doc(db, 'sessions', sessionCode)
  const updatedVotes = { ...currentVotes, [voterId]: vote }
  await updateDoc(ref, { 'currentRound.votes': updatedVotes })
  return updatedVotes
}

/**
 * Ermittelt Mehrheitsentscheid. Gibt null zurück, wenn noch nicht
 * alle stimmberechtigten Spieler abgestimmt haben – außer
 * `force` ist true (z.B. weil die Abstimmzeit abgelaufen ist),
 * dann wird mit den bisher abgegebenen Stimmen entschieden.
 * Niemand abgestimmt + force → 'failed' (im Zweifel keine Anerkennung).
 */
export function tallyVotes(votes, eligibleVoterIds, force = false) {
  const cast = eligibleVoterIds.filter((id) => votes[id])
  if (cast.length < eligibleVoterIds.length && !force) return null

  if (cast.length === 0) return 'failed'

  const yesCount = cast.filter((id) => votes[id] === 'yes').length
  const noCount = cast.length - yesCount
  return yesCount >= noCount ? 'success' : 'failed'
}

export async function finalizeRound(sessionCode, { outcome, players, stats, selectedPlayerId }) {
  const updatedStats = { ...stats }
  const current = ensurePlayerStats(updatedStats, selectedPlayerId)

  if (outcome === 'success') {
    updatedStats[selectedPlayerId] = {
      ...current,
      wins: current.wins + 1,
      completed: current.completed + 1
    }
  } else if (outcome === 'failed') {
    updatedStats[selectedPlayerId] = {
      ...current,
      losses: current.losses + 1,
      failed: current.failed + 1
    }
  } else if (outcome === 'punished') {
    updatedStats[selectedPlayerId] = {
      ...current,
      losses: current.losses + 1,
      punishments: current.punishments + 1
    }
  }

  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, {
    'currentRound.outcome': outcome,
    'currentRound.phase': 'result',
    stats: updatedStats
  })

  // Medien sind nur temporär (siehe Brief: "Automatically delete media").
  // Der Lösch-Trigger für Firebase Storage läuft idealerweise über eine
  // Cloud Function, sobald `currentRound.phase === 'result'` erreicht ist
  // (siehe README "Storage-Cleanup"), da das aus dem Client heraus nicht
  // zuverlässig garantiert werden kann.
}

export async function clearRound(sessionCode) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { currentRound: null })
}
