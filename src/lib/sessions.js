import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode() {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('')
}

export function generatePlayerId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ── Session erstellen ─────────────────────────────────────────────────────────
export async function createSession({ hostId, hostName, hostCharacterId, sessionName }) {
  const code = generateCode()
  await setDoc(doc(db, 'sessions', code), {
    code,
    hostId,
    sessionName: sessionName || 'RIOT',
    status: 'lobby',
    paused: false,
    players: [{ id: hostId, name: hostName || 'Host', characterId: hostCharacterId || null, isHost: true }],
    currentRound: null,
    nextRoundAt: null,
    stats: {},
    settings: {},
    createdAt: new Date(),
  })
  return code
}

// ── Spieler beitreten ─────────────────────────────────────────────────────────
export async function joinSession(code, { id, name, characterId }) {
  const ref = doc(db, 'sessions', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const players = snap.data().players || []
  if (players.some(p => p.id === id)) return // bereits drin
  await updateDoc(ref, { players: [...players, { id, name, characterId, isHost: false }] })
}

// ── Spieler entfernen (Lobby) ─────────────────────────────────────────────────
export async function removePlayer(code, player) {
  const ref = doc(db, 'sessions', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const players = (snap.data().players || []).filter(p => p.id !== player.id)
  await updateDoc(ref, { players })
}

// ── Spieler rauswerfen (mid-game) ─────────────────────────────────────────────
export async function kickPlayer(code, playerId) {
  const ref = doc(db, 'sessions', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const players = (snap.data().players || []).filter(p => p.id !== playerId)
  await updateDoc(ref, { players })
}

// ── Session starten ───────────────────────────────────────────────────────────
export async function startSession(code) {
  await updateDoc(doc(db, 'sessions', code), { status: 'active' })
}

// ── Session beenden ───────────────────────────────────────────────────────────
export async function endSession(code) {
  await updateDoc(doc(db, 'sessions', code), { status: 'ended' })
}

// ── Settings aktualisieren ────────────────────────────────────────────────────
export async function updateSessionSettings(code, settings) {
  await updateDoc(doc(db, 'sessions', code), { settings })
}

// ── Spiel pausieren / fortsetzen ──────────────────────────────────────────────
export async function pauseSession(code) {
  await updateDoc(doc(db, 'sessions', code), { paused: true })
}

export async function resumeSession(code) {
  await updateDoc(doc(db, 'sessions', code), { paused: false })
}

// ── Realtime-Subscription ─────────────────────────────────────────────────────
export function subscribeToSession(code, onData, onError) {
  return onSnapshot(
    doc(db, 'sessions', code),
    (snap) => {
      if (!snap.exists()) { onError?.(); return }
      onData({ ...snap.data(), code: snap.id })
    },
    (err) => {
      console.error('[Session] Subscription error:', err)
      onError?.()
    }
  )
}

// ── Einmalig lesen ────────────────────────────────────────────────────────────
export async function getSessionOnce(code) {
  const snap = await getDoc(doc(db, 'sessions', code))
  if (!snap.exists()) return null
  return { ...snap.data(), code: snap.id }
}
