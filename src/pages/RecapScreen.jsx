import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => {
    if (!snapshot || !ownPlayerId || hasRecordedRef.current) return
    hasRecordedRef.current = true

    const ownStats = ensurePlayerStats(snapshot.stats, ownPlayerId)
    const sortedByWins = [...snapshot.players].sort(
      (a, b) =>
        ensurePlayerStats(snapshot.stats, b.id).wins -
        ensurePlayerStats(snapshot.stats, a.id).wins
    )
    const isTopPlayer = sortedByWins[0]?.id === ownPlayerId && ownStats.wins > 0

    recordGameResult({
      challengesCompleted: ownStats.completed,
      challengesFailed: ownStats.failed,
      sipsGiven: 0,
      sipsTaken: ownStats.punishments,
      won: isTopPlayer,
      wasMvp: isTopPlayer
    })

    // Session-Verlauf in localStorage speichern
    try {
      const history = JSON.parse(localStorage.getItem('riot_game_history') || '[]')
      history.unshift({
        sessionName: snapshot.sessionName || 'RIOT',
        players: snapshot.players.map(p => ({ id: p.id, name: p.name, characterId: p.characterId })),
        roundNumber: snapshot.roundNumber || 0,
        winner: sortedByWins[0]?.name || null,
        createdAtMs: snapshot.createdAtMs || Date.now(),
        endedAtMs: Date.now(),
      })
      // Max. 20 Einträge behalten
      localStorage.setItem('riot_game_history', JSON.stringify(history.slice(0, 20)))
    } catch (_) {/* ignore */}

    setLocalStatsRecorded(true)
  }, [snapshot, ownPlayerId])

  if (!snapshot) {
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
    (a, b) =>
      ensurePlayerStats(snapshot.stats, b.id).wins -
      ensurePlayerStats(snapshot.stats, a.id).wins
  )
  const winner = sortedPlayers[0]
  const totalChallenges = snapshot.players.reduce((sum, p) => {
    const s = ensurePlayerStats(snapshot.stats, p.id)
    return sum + s.completed + s.failed
  }, 0)
  const duration = snapshot.createdAtMs ? Date.now() - snapshot.createdAtMs : null

  // Podium: show top 3 in order [2nd, 1st, 3rd] (visual podium layout)
  const podiumOrder =
    sortedPlayers.length >= 3
      ? [sortedPlayers[1], sortedPlayers[0], sortedPlayers[2]]
      : sortedPlayers.length === 2
      ? [null, sortedPlayers[0], sortedPlayers[1]]
      : [null, sortedPlayers[0], null]

  return (
    <div className="recap-screen">
      <Confetti count={40} />

      <div className="recap-screen__top-row">
        <span className="eyebrow">Party-Replay</span>
      </div>

      <motion.h1
        className="recap-screen__title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        🍻 Euer Abend
      </motion.h1>

      {/* Podium für Top 3 */}
      {sortedPlayers.length > 0 && (
        <motion.div
          className="recap-screen__podium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {podiumOrder.map((p, col) => {
            if (!p) return <div key={col} className="recap-screen__podium-slot" />
            const rank = col === 1 ? 1 : col === 0 ? 2 : 3
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
            const s = ensurePlayerStats(snapshot.stats, p.id)
            const char = getCharacterById(p.characterId)
            return (
              <motion.div
                key={p.id}
                className={`recap-screen__podium-slot recap-screen__podium-slot--rank${rank}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + col * 0.07 }}
              >
                <div className="recap-screen__podium-avatar">
                  {char?.icon || '🎮'}
                </div>
                <span className="recap-screen__podium-name">{p.name}</span>
                <span className="recap-screen__podium-medal">{medal}</span>
                <div className="recap-screen__podium-block">
                  <span className="recap-screen__podium-wins">{s.wins} 🏆</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Stats summary */}
      <motion.div
        className="recap-screen__summary glass"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">⏱ Dauer</span>
          <span className="recap-screen__summary-value">{formatDuration(duration)}</span>
        </div>
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">👥 Spieler</span>
          <span className="recap-screen__summary-value">{snapshot.players.length}</span>
        </div>
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">🔁 Runden</span>
          <span className="recap-screen__summary-value">{snapshot.roundNumber}</span>
        </div>
        <div className="recap-screen__summary-row">
          <span className="recap-screen__summary-label">⚡ Challenges</span>
          <span className="recap-screen__summary-value">{totalChallenges}</span>
        </div>
      </motion.div>

      {/* Per-player breakdown */}
      {sortedPlayers.length > 1 && (
        <div className="recap-screen__players">
          <span className="eyebrow">Spieler-Stats</span>
          <div className="recap-screen__players-list">
            {sortedPlayers.map((p, i) => {
              const s = ensurePlayerStats(snapshot.stats, p.id)
              const char = getCharacterById(p.characterId)
              const total = (s.completed || 0) + (s.failed || 0)
              const rate = total > 0 ? Math.round((s.completed / total) * 100) : 0
              return (
                <motion.div
                  key={p.id}
                  className={`recap-screen__player-row glass ${p.id === ownPlayerId ? 'recap-screen__player-row--own' : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 + i * 0.06 }}
                >
                  <div className="recap-screen__player-avatar">
                    {char?.icon || '🎮'}
                  </div>
                  <div className="recap-screen__player-info">
                    <span className="recap-screen__player-name">
                      {p.name}
                      {p.id === ownPlayerId && (
                        <span className="recap-screen__player-you"> (Du)</span>
                      )}
                    </span>
                    <span className="recap-screen__player-sub">
                      {s.completed ?? 0} geschafft · {s.failed ?? 0} nicht · {s.punishments ?? 0} Strafen
                    </span>
                  </div>
                  <div className="recap-screen__player-rate">
                    <span className="recap-screen__player-rate-value">{rate}%</span>
                    <span className="recap-screen__player-rate-label">Quote</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Awards */}
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
        {/* Share-Button */}
        {typeof navigator?.share === 'function' && (
          <button
            className="recap-screen__share-btn"
            onClick={() => {
              const winnerName = sortedPlayers[0]?.name || '?'
              const sessionName = snapshot.sessionName || 'RIOT'
              navigator.share({
                title: `${sessionName} – RIOT`,
                text: `🏆 ${winnerName} hat gewonnen! ${snapshot.roundNumber} Runden, ${totalChallenges} Challenges. Wer ist beim nächsten Mal dabei?`,
                url: window.location.origin,
              }).catch(() => {})
            }}
          >
            Ergebnis teilen ↑
          </button>
        )}
        <button className="btn-primary" onClick={() => navigate('/menu')}>
          Zurück zum Menü
        </button>
        {localStatsRecorded && (
          <button
            className="recap-screen__profile-link"
            onClick={() => navigate('/profile')}
          >
            Meine Statistiken ansehen
          </button>
        )}
      </motion.div>
    </div>
  )
}
