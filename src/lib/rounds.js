import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { pickRandomChallenge, pickRandomPlayer, getProofType } from './challenges'
import { maybePickPartyEvent } from './partyEvents'

/**
 * Firestore-Struktur der aktiven Runde:
 *
 * sessions/{sessionCode}
 *   currentRound: {
 *     roundNumber:       number
 *     phase:             'countdown'|'spinning'|'challenge'|'recording'|'voting'|'result'
 *     selectedPlayerId:  string
 *     challengeText:     string
 *     proofType:         'photo'|'audio'|'video'|'none'   ← NEU
 *     difficulty:        string
 *     decision:          'pending'|'accepted'|'punishment'
 *     proofUrl:          string | null
 *     votes:             { [playerId]: 'yes'|'no' }
 *     outcome:           'success'|'failed'|'punished'|null
 *     partyEvent:        { key, title, icon, description, effect } | null
 *     startedAt:         serverTimestamp
 *   } | null
 *   stats: {
 *     [playerId]: { wins, losses, completed, failed, punishments, battleWins }
 *   }
 */

function emptyStats() {
  return { wins: 0, losses: 0, completed: 0, failed: 0, punishments: 0, battleWins: 0, skips: 0 }
}

export function ensurePlayerStats(stats, playerId) {
  return stats?.[playerId] || emptyStats()
}

export async function startNewRound(
  sessionCode,
  {
    players, difficulty, locationMode, roundNumber,
    previousSelectedPlayerId, skipCountdown = false,
    language = 'de', customChallenges = [], battleRoundEvery = 5
  }
) {
  const excludeIds = previousSelectedPlayerId ? [previousSelectedPlayerId] : []
  const selected = pickRandomPlayer(players, excludeIds)

  // Battle-Runde erkennen (jede N-te Runde, ab Runde 2, mind. 2 Spieler)
  const isBattle =
    battleRoundEvery > 0 &&
    roundNumber > 1 &&
    roundNumber % battleRoundEvery === 0 &&
    players.length >= 2

  let battleOpponentId = null
  if (isBattle) {
    const others = players.filter(p => p.id !== selected.id)
    if (others.length > 0) battleOpponentId = pickRandomPlayer(others, []).id
  }

  const challengeText = pickRandomChallenge(difficulty, locationMode, language, customChallenges)
  const proofType = isBattle ? 'none' : getProofType(challengeText)
  const partyEvent = isBattle ? null : maybePickPartyEvent(roundNumber)

  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, {
    currentRound: {
      roundNumber,
      phase: skipCountdown ? 'spinning' : 'countdown',
      selectedPlayerId: selected.id,
      challengeText,
      proofType,
      difficulty,
      decision: 'pending',
      proofUrl: null,
      votes: {},
      outcome: null,
      partyEvent: partyEvent || null,
      startedAt: serverTimestamp(),
      // Battle-Felder
      isBattle: isBattle || false,
      battleOpponentId: battleOpponentId || null,
      battleDecisions: isBattle ? {} : null,
      battleVotes: isBattle ? {} : null,
      battleWinnerId: null,
    },
    nextRoundAt: null
  })
}

export async function advanceToSpinning(sessionCode) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { 'currentRound.phase': 'spinning' })
}

export async function advanceRoundPhase(sessionCode, phase) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { 'currentRound.phase': phase })
}

export async function setRoundDecision(sessionCode, decision, proofType = 'photo') {
  const ref = doc(db, 'sessions', sessionCode)
  let nextPhase = 'result'
  if (decision === 'accepted') {
    // 'none'-Challenges überspringen die Recording-Phase komplett
    nextPhase = proofType === 'none' ? 'voting' : 'recording'
  }
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

export function tallyVotes(votes, eligibleVoterIds, force = false) {
  const cast = eligibleVoterIds.filter((id) => votes[id])
  if (cast.length < eligibleVoterIds.length && !force) return null
  if (cast.length === 0) return 'failed'
  const yesCount = cast.filter((id) => votes[id] === 'yes').length
  const noCount = cast.length - yesCount
  return yesCount >= noCount ? 'success' : 'failed'
}

export async function finalizeRound(
  sessionCode,
  { outcome, players, stats, selectedPlayerId, pointsMultiplier = 1, nextRoundDelayMs = null }
) {
  const updatedStats = { ...stats }
  const current = ensurePlayerStats(updatedStats, selectedPlayerId)

  if (outcome === 'success') {
    updatedStats[selectedPlayerId] = {
      ...current,
      wins: current.wins + pointsMultiplier,
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
    stats: updatedStats,
    // Bei 'timed'-Modus: Zeitstempel für automatischen Rundenstart
    nextRoundAt: nextRoundDelayMs != null
      ? new Date(Date.now() + nextRoundDelayMs)
      : null
  })
}

export async function clearRound(sessionCode) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { currentRound: null })
}

// ── Challenge neu würfeln (Host, Challenge-Phase) ─────────────────────────────
export async function rerollChallenge(sessionCode, difficulty, locationMode, language = 'de', customChallenges = []) {
  const newText = pickRandomChallenge(difficulty, locationMode, language, customChallenges)
  const proofType = getProofType(newText)
  await updateDoc(doc(db, 'sessions', sessionCode), {
    'currentRound.challengeText': newText,
    'currentRound.proofType': proofType,
  })
}

// ── Challenge überspringen (1× pro Spiel, ausgewählter Spieler) ───────────────
export async function skipChallenge(sessionCode, playerId, stats) {
  const updatedStats = { ...stats }
  const current = ensurePlayerStats(updatedStats, playerId)
  updatedStats[playerId] = { ...current, skips: (current.skips || 0) + 1 }
  await updateDoc(doc(db, 'sessions', sessionCode), {
    'currentRound.outcome': 'skipped',
    'currentRound.phase': 'result',
    stats: updatedStats,
    nextRoundAt: null,
  })
}

// ── Battle: Entscheidung eines Spielers speichern ────────────────────────────
export async function setBattleDecision(sessionCode, playerId, decision) {
  await updateDoc(doc(db, 'sessions', sessionCode), {
    [`currentRound.battleDecisions.${playerId}`]: decision,
  })
}

// ── Battle: Stimme abgeben (wer hat gewonnen?) ───────────────────────────────
export async function castBattleVote(sessionCode, currentVotes, voterId, winnerPlayerId) {
  const updatedVotes = { ...(currentVotes || {}), [voterId]: winnerPlayerId }
  await updateDoc(doc(db, 'sessions', sessionCode), {
    'currentRound.battleVotes': updatedVotes,
  })
  return updatedVotes
}

// ── Battle abschließen und Gewinner ermitteln ─────────────────────────────────
export async function finalizeBattle(sessionCode, { decisions, mainId, oppId, stats, battleVotes = null }) {
  const mainDecision = decisions?.[mainId]
  const oppDecision = decisions?.[oppId]

  let winnerId = null
  let loserId = null

  if (mainDecision === 'punishment' && oppDecision === 'punishment') {
    // Beide bestraft → kein Gewinner
  } else if (mainDecision !== 'punishment' && oppDecision === 'punishment') {
    winnerId = mainId; loserId = oppId
  } else if (mainDecision === 'punishment' && oppDecision !== 'punishment') {
    winnerId = oppId; loserId = mainId
  } else if (battleVotes && Object.keys(battleVotes).length > 0) {
    // Beide accepted → Voting entscheidet
    const counts = {}
    Object.values(battleVotes).forEach(v => { counts[v] = (counts[v] || 0) + 1 })
    if ((counts[mainId] || 0) >= (counts[oppId] || 0)) {
      winnerId = mainId; loserId = oppId
    } else {
      winnerId = oppId; loserId = mainId
    }
  } else {
    // Beide accepted, kein Voting → Unentschieden
  }

  const updatedStats = { ...stats }
  if (winnerId) {
    const ws = ensurePlayerStats(updatedStats, winnerId)
    updatedStats[winnerId] = {
      ...ws,
      wins: (ws.wins || 0) + 2,          // Battle = doppelte Punkte
      battleWins: (ws.battleWins || 0) + 1,
      completed: (ws.completed || 0) + 1,
    }
  }
  if (loserId) {
    const ls = ensurePlayerStats(updatedStats, loserId)
    updatedStats[loserId] = { ...ls, losses: (ls.losses || 0) + 1 }
  }

  await updateDoc(doc(db, 'sessions', sessionCode), {
    'currentRound.phase': 'result',
    'currentRound.battleWinnerId': winnerId,
    'currentRound.outcome': winnerId ? 'success' : 'failed',
    stats: updatedStats,
    nextRoundAt: null,
  })
}
