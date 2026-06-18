import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { calculateAwards } from '../lib/awards'
import { recordGameResult } from '../lib/localStats'
import { ensurePlayerStats } from '../lib/rounds'
import { getCharacterById } from '../lib/characters'
import Confetti from '../components/Confetti'
import './RecapScreen.css'

function formatDuration(ms) {
  if (!ms || ms < 0) return '–'
  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} Min`
  return `${hours} Std ${minutes} Min`
}

export default function RecapScreen({}) {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const snapshot = location.state?.sessionSnapshot
  const ownPlayerId = location.state?.ownPlayerId
  const hasRecordedRef = useRef(false)
  const [localStatsRecorded, setLocalStatsRecorded] = useState(false)

  // Statistiken nur einmal pro Aufruf in localStorage übernehmen –
  // bei einem versehentlichen Reload dieses Screens (z.B. Browser-
  // Aktualisierung) darf das Spiel nicht doppelt gezählt werden, da
  // location.state nach einem Reload ohnehin verloren geht und der
  // Screen dann auf den Fallback unten ausweicht.
  useEffect(() => {
    if (!snapshot || !ownPlayerId || hasRecordedRef.current) return
    hasRecordedRef.current = true

    const ownStats = ensurePlayerStats(snapshot.stats, ownPlayerId)
    const sortedByWins = [...snapshot.players].sort(
      (a, b) => ensurePlayerStats(snapshot.stats, b.id).wins - ensurePlayerStats(snapshot.stats, a.id).wins
    )
    const isTopPlayer = sortedByWins[0]?.id === ownPlayerId && ownStats.wins > 0

    recordGameResult({
      challengesCompleted: ownStats.completed,
      challengesFailed: ownStats.failed,
      sipsGiven: 0, // wird erfasst, sobald Schluck-Mengen pro Strafe getrackt werden
      sipsTaken: ownStats.punishments,
      won: isTopPlayer,
      wasMvp: isTopPlayer
    })
    setLocalStatsRecorded(true)
  }, [snapshot, ownPlayerId])

  if (!snapshot) {
    // Direkter Aufruf ohne Navigations-State (z.B. Reload) – wir haben
    // keine Session-Daten mehr zum Anzeigen, da Firestore nach Spielende
    // keine Garantie für players/stats-Erhalt über längere Zeit gibt.
    return (
      <div className="recap-screen recap-screen--centered">
        <p className="recap-screen__fallback-text">
          Die Zusammenfassung dieses Spiels ist nicht mehr verfügbar.
        </p>
        <button className="btn-primary" onClick={() => navigate('/menu')}>
          Zurück zum Menü
        </button>
      </div>
    )
  }

  const awards = calculateAwards(snapshot.players, snapshot.stats)
  const sortedPlayers = [...snapshot.players].sort(
    (a, b) => ensurePlayerStats(snapshot.stats, b.id).wins - ensurePlayerStats(snapshot.stats, a.id).wins
  )
  const winner = sortedPlayers[0]
  const totalChallenges = snapshot.players.reduce((sum, p) => {
    const s = ensurePlayerStats(snapshot.stats, p.id)
    return sum + s.completed + s.failed
  }, 0)
  const duration = snapshot.createdAtMs ? Date.now() - snapshot.createdAtMs : null

  return (
    <div className="recap-screen">
      <Confetti count={32} />
      <div className="recap-screen__top-row">
        <span className="eyebrow">Party-Replay</span>
      </div>

      <motion.h1
        className="recap-screen__title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        🍻 Euer Abend in Zahlen
      </motion.h1>

      <motion.div
        className="recap-screen__summary glass"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">Dauer</span>
          <span className="recap-screen__summary-value">{formatDuration(duration)}</span>
        </div>
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">Spieler</span>
          <span className="recap-screen__summary-value">{snapshot.players.length}</span>
        </div>
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">Runden gespielt</span>
          <span className="recap-screen__summary-value">{snapshot.roundNumber}</span>
        </div>
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">Challenges insgesamt</span>
          <span className="recap-screen__summary-value">{totalChallenges}</span>
        </div>
      </motion.div>

      {winner && (
        <motion.div
          className="recap-screen__winner glass"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <span className="recap-screen__winner-icon">🏆</span>
          <span className="recap-screen__winner-icon-char">
            {getCharacterById(winner.characterId)?.icon || '🎮'}
          </span>
          <p className="recap-screen__winner-name">{winner.name} gewinnt den Abend</p>
        </motion.div>
      )}

      {awards.length > 0 && (
        <div className="recap-screen__awards">
          <span className="eyebrow">Awards</span>
          <div className="recap-screen__awards-list">
            {awards.map((award, i) => (
              <motion.div
                key={award.key}
                className="recap-screen__award glass"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
              >
                <span className="recap-screen__award-icon">{award.icon}</span>
                <div className="recap-screen__award-text">
                  <span className="recap-screen__award-title">{award.title}</span>
                  <span className="recap-screen__award-player">{award.playerName}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="recap-screen__actions"
      >
        <button className="btn-primary" onClick={() => navigate('/menu')}>
          Zurück zum Menü
        </button>
        {localStatsRecorded && (
          <button className="recap-screen__profile-link" onClick={() => navigate('/profile')}>
            Meine Statistiken ansehen
          </button>
        )}
      </motion.div>
    </div>
  )
}
