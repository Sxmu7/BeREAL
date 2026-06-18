import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { readLocalStats, resetLocalStats } from '../lib/localStats'
import { isSoundEnabled, setSoundEnabled, playCardSound } from '../lib/sounds'
import './ProfileScreen.css'

function StatCard({ icon, label, value, delay }) {
  return (
    <motion.div
      className="profile-screen__stat glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      <span className="profile-screen__stat-icon">{icon}</span>
      <span className="profile-screen__stat-value">{value}</span>
      <span className="profile-screen__stat-label">{label}</span>
    </motion.div>
  )
}

export default function ProfileScreen({ player, resetPlayer }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState(readLocalStats)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)

  function handleResetConfirmed() {
    setStats(resetLocalStats())
    setConfirmingReset(false)
  }

  function handleDeleteConfirmed() {
    resetPlayer()
    navigate('/', { replace: true })
  }

  function handleToggleSound() {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
    if (next) playCardSound()
  }

  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0

  return (
    <div className="profile-screen">
      <div className="profile-screen__top-row">
        <button className="profile-screen__back" onClick={() => navigate('/menu')}>
          ← Zurück
        </button>
      </div>

      <div className="profile-screen__header">
        <span className="eyebrow">Statistiken</span>
        <h1 className="profile-screen__title">{player?.name || 'Spieler'}</h1>
        <p className="profile-screen__subtitle">
          {stats.gamesPlayed === 0
            ? 'Noch keine Spiele gespielt'
            : `${stats.gamesPlayed} ${
                stats.gamesPlayed === 1 ? 'Spiel' : 'Spiele'
              } gespielt · ${winRate}% Siegquote`}
        </p>
      </div>

      <div className="profile-screen__grid">
        <StatCard icon="🎮" label="Spiele gespielt" value={stats.gamesPlayed} delay={0} />
        <StatCard icon="🏆" label="Siege" value={stats.wins} delay={0.04} />
        <StatCard
          icon="✅"
          label="Challenges geschafft"
          value={stats.challengesCompleted}
          delay={0.08}
        />
        <StatCard
          icon="❌"
          label="Challenges verloren"
          value={stats.challengesFailed}
          delay={0.12}
        />
        <StatCard icon="🍻" label="Schlücke verteilt" value={stats.sipsGiven} delay={0.16} />
        <StatCard icon="🥴" label="Schlücke getrunken" value={stats.sipsTaken} delay={0.2} />
        <StatCard icon="⭐" label="MVP-Auszeichnungen" value={stats.mvpAwards} delay={0.24} />
      </div>

      <div className="profile-screen__settings glass">
        <div className="profile-screen__setting-row">
          <div>
            <p className="profile-screen__setting-title">Sound & Vibration</p>
            <p className="profile-screen__setting-subtitle">
              Karten-, Erfolgs- und Countdown-Sounds
            </p>
          </div>
          <button
            className={
              soundOn
                ? 'profile-screen__switch profile-screen__switch--on'
                : 'profile-screen__switch'
            }
            onClick={handleToggleSound}
            aria-label={soundOn ? 'Sound ausschalten' : 'Sound einschalten'}
          >
            <span className="profile-screen__switch-knob" />
          </button>
        </div>
      </div>

      <div className="profile-screen__reset-wrap">
        {confirmingReset ? (
          <div className="profile-screen__confirm">
            <p className="profile-screen__confirm-text">
              Statistiken wirklich zurücksetzen? Das kann nicht rückgängig gemacht werden.
            </p>
            <div className="profile-screen__confirm-actions">
              <button
                className="profile-screen__cancel"
                onClick={() => setConfirmingReset(false)}
              >
                Abbrechen
              </button>
              <button className="profile-screen__confirm-btn" onClick={handleResetConfirmed}>
                Zurücksetzen
              </button>
            </div>
          </div>
        ) : (
          <button className="profile-screen__reset" onClick={() => setConfirmingReset(true)}>
            Statistiken zurücksetzen
          </button>
        )}
      </div>

      {/* ── Konto löschen ── */}
      <div className="profile-screen__delete-wrap">
        {confirmingDelete ? (
          <div className="profile-screen__confirm profile-screen__confirm--danger">
            <p className="profile-screen__confirm-text">
              Konto wirklich löschen? Dein Name, Charakter und alle Statistiken werden unwiderruflich gelöscht.
            </p>
            <div className="profile-screen__confirm-actions">
              <button
                className="profile-screen__cancel"
                onClick={() => setConfirmingDelete(false)}
              >
                Abbrechen
              </button>
              <button
                className="profile-screen__confirm-btn profile-screen__confirm-btn--danger"
                onClick={handleDeleteConfirmed}
              >
                Löschen
              </button>
            </div>
          </div>
        ) : (
          <button
            className="profile-screen__delete-btn"
            onClick={() => setConfirmingDelete(true)}
          >
            🗑 Benutzer löschen
          </button>
        )}
      </div>
    </div>
  )
}
