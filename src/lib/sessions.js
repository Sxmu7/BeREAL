import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Firestore-Struktur:
 *
 * sessions/{sessionCode}
 *   hostId: string
 *   sessionName: string
 *   status: 'lobby' | 'active' | 'ended'
 *   settings: {
 *     gameMode: 'party' | 'casual'
 *     challengeFrequency: 'chill' | 'party' | 'chaos' | 'custom'
 *     customIntervalMin: number | null
 *     customIntervalMax: number | null
 *     challengeTimer: number   // Sekunden
 *     difficulty: 'easy' | 'medium' | 'hard' | 'chaos'
 *     battleRoundEvery: number | null
 *     punishmentLevel: 'mild' | 'medium' | 'heavy'
 *   }
 *   players: [{ id, name, characterId, drink, isHost, joinedAt }]
 *   createdAt: serverTimestamp
 */

function randomSessionCode() {
  // 5-stelliger Code, ohne verwechselbare Zeichen (0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function generatePlayerId() {
  return `p_${Math.random().toString(36).slice(2, 10)}`
}

const DEFAULT_SETTINGS = {
  gameMode: 'party',
  challengeFrequency: 'party',
  customIntervalMin: 5,
  customIntervalMax: 10,
  challengeTimer: 180,
  difficulty: 'medium',
  battleRoundEvery: 5,
  punishmentLevel: 'medium'
}

/**
 * Erstellt eine neue Session mit eindeutigem Code. Versucht bei
 * Kollision (sehr unwahrscheinlich) bis zu 5x neu.
 */
export async function createSession({ hostId, hostName, hostCharacterId, sessionName }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomSessionCode()
    const ref = doc(db, 'sessions', code)
    try {
      await setDoc(ref, {
        hostId,
        sessionName: sessionName || `${hostName}'s Session`,
        status: 'lobby',
        settings: DEFAULT_SETTINGS,
        players: [
          {
            id: hostId,
            name: hostName,
            characterId: hostCharacterId,
            drink: null,
            isHost: true,
            joinedAt: Date.now()
          }
        ],
        createdAt: serverTimestamp()
      })
      return code
    } catch (err) {
      console.warn('Session-Erstellung fehlgeschlagen, neuer Versuch:', err)
    }
  }
  throw new Error('Session konnte nicht erstellt werden.')
}

export async function updateSessionSettings(sessionCode, settings) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { settings })
}

export async function joinSession(sessionCode, player) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, {
    players: arrayUnion({
      id: player.id,
      name: player.name,
      characterId: player.characterId,
      drink: null,
      isHost: false,
      joinedAt: Date.now()
    })
  })
}

export async function leaveSession(sessionCode, playerEntry) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, {
    players: arrayRemove(playerEntry)
  })
}

export async function removePlayer(sessionCode, playerEntry) {
  return leaveSession(sessionCode, playerEntry)
}

export async function setPlayerDrink(sessionCode, players, playerId, drink) {
  const ref = doc(db, 'sessions', sessionCode)
  const updated = players.map((p) => (p.id === playerId ? { ...p, drink } : p))
  await updateDoc(ref, { players: updated })
}

export async function startSession(sessionCode) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { status: 'active', startedAt: serverTimestamp() })
}

export async function endSession(sessionCode) {
  const ref = doc(db, 'sessions', sessionCode)
  await updateDoc(ref, { status: 'ended', endedAt: serverTimestamp() })
}

export async function deleteSession(sessionCode) {
  await deleteDoc(doc(db, 'sessions', sessionCode))
}

/**
 * Abonniert Live-Updates einer Session. Gibt die Unsubscribe-Funktion
 * zurück. `onMissing` wird aufgerufen, wenn die Session nicht (mehr)
 * existiert (z.B. Code falsch eingegeben, oder Host hat beendet).
 */
export function subscribeToSession(sessionCode, onUpdate, onMissing) {
  const ref = doc(db, 'sessions', sessionCode)
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onMissing?.()
        return
      }
      onUpdate({ code: snap.id, ...snap.data() })
    },
    (err) => {
      console.error('Session-Listener-Fehler:', err)
      onMissing?.()
    }
  )
}
