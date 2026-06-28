import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCharacterById } from '../lib/characters'
import { getLastSessionCode } from '../lib/lastSession'
import { getSessionOnce } from '../lib/sessions'
import { useState, useEffect } from 'react'
import './MainMenu.css'

function getLocalStats() {
  try {
    const raw = localStorage.getItem('daredrop_local_stats')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function MainMenu({ player }) {
  const navigate = useNavigate()
  const character = getCharacterById(player.characterId)
  const [lastSession, setLastSession] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const code = getLastSessionCode()
    if (code) {
      getSessionOnce(code).then((s) => {
        if (s && s.status !== 'ended') setLastSession(s)
      }).catch(() => {})
    }
    setStats(getLocalStats())
  }, [])

  const h = new Date().getHours()
  const greeting =
    h < 12 ? `Guten Morgen, ${player.name || 'hey'} 👋`
    : h < 18 ? `Hallo, ${player.name || 'hey'} 👋`
    : `Hey, ${player.name || 'hey'} 👋`

  return (
    <div className="home">
      {/* Header */}
      <motion.div
        className="home__header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h1 className="home__greeting">{greeting}</h1>
          <p className="home__sub">Was möchtest du tun?</p>
        </div>
        <button
          className="home__avatar avatar-bubble"
          onClick={() => navigate('/profile')}
          style={{ background: 'var(--gradient-avatar-1)' }}
        >
          {character?.icon || '🎮'}
        </button>
      </motion.div>

      {/* Stats bar */}
      {stats && stats.gamesPlayed > 0 && (
        <motion.div
          className="home__stats-bar glass"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className="home__stat">
            <span className="home__stat-value">{stats.gamesPlayed ?? 0}</span>
            <span className="home__stat-label">Spiele</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">{stats.wins ?? 0}</span>
            <span className="home__stat-label">Siege</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">{stats.challengesCompleted ?? 0}</span>
            <span className="home__stat-label">Challenges</span>
          </div>
        </motion.div>
      )}

      {/* Action cards */}
      <div className="home__actions">
        <motion.button
          className="home__action-card home__action-card--host glass"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/host')}
        >
          <div className="home__action-icon">
            <span>⚡</span>
          </div>
          <div className="home__action-text">
            <span className="home__action-title">Spiel erstellen</span>
            <span className="home__action-sub">Starte deine eigene Runde</span>
          </div>
          <span className="home__action-arrow">›</span>
        </motion.button>

        <motion.button
          className="home__action-card home__action-card--join glass"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/join')}
        >
          <div className="home__action-icon">
            <span>👥</span>
          </div>
          <div className="home__action-text">
            <span className="home__action-title">Spiel beitreten</span>
            <span className="home__action-sub">Mit Code einsteigen</span>
          </div>
          <span className="home__action-arrow">›</span>
        </motion.button>
      </div>

      {/* Last session */}
      {lastSession && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <p className="home__section-title">Letztes Spiel</p>
          <button
            className="home__last-session glass"
            onClick={() => navigate(
              lastSession.status === 'active'
                ? `/game/${lastSession.code}`
                : `/lobby/${lastSession.code}`
            )}
          >
            <div className="home__last-avatars">
              {(lastSession.players || []).slice(0, 3).map((p, i) => (
                <span
                  key={p.id}
                  className="home__last-avatar"
                  style={{ zIndex: 3 - i, marginLeft: i > 0 ? -12 : 0 }}
                >
                  {getCharacterById(p.characterId)?.icon || '🎮'}
                </span>
              ))}
            </div>
            <div className="home__last-info">
              <span className="home__last-name">{lastSession.sessionName || 'Spiel'}</span>
              <span className="home__last-meta">
                {lastSession.players?.length || 0} Spieler · Fortsetzen
              </span>
            </div>
            <span className="home__action-arrow">›</span>
          </button>
        </motion.div>
      )}

      {/* Secondary */}
      <motion.div
        className="home__secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
      >
        {[
          { icon: '📖', label: 'Regeln', path: '/rules' },
          { icon: '🏆', label: 'Stats', path: '/profile' }
        ].map((item) => (
          <button
            key={item.path}
            className="home__secondary-btn"
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  )
}
