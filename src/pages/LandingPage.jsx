import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getLastSessionCode, clearLastSession } from '../lib/lastSession'
import { getSessionOnce } from '../lib/sessions'
import './LandingPage.css'

export default function LandingPage({ player, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [name, setName] = useState(player?.name || '')
  const [resumableSession, setResumableSession] = useState(undefined)
  const isReturning = !!player?.name

  useEffect(() => {
    const lastCode = getLastSessionCode()
    if (!lastCode) { setResumableSession(null); return }
    getSessionOnce(lastCode)
      .then((data) => {
        if (data && data.status !== 'ended') setResumableSession(data)
        else { clearLastSession(); setResumableSession(null) }
      })
      .catch(() => setResumableSession(null))
  }, [])

  function handleResume() {
    if (!resumableSession) return
    const path = resumableSession.status === 'active'
      ? `/game/${resumableSession.code}`
      : `/lobby/${resumableSession.code}`
    navigate(path)
  }

  function handleContinue() {
    const trimmed = name.trim()
    if (!trimmed && !isReturning) return
    if (trimmed && trimmed !== player?.name) {
      // Name hat sich geändert → durch NameScreen leiten damit er gespeichert wird
      navigate('/name', { state: { prefill: trimmed } })
      return
    }
    navigate(player?.characterId ? '/menu' : '/character')
  }

  const canContinue = isReturning || name.trim().length >= 2

  return (
    <div className="landing">
      {/* Radial-Glow im Hintergrund */}
      <div className="landing__glow" />

      <motion.div
        className="landing__inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="landing__logo">
          <span className="landing__logo-icon">🥃</span>
        </div>

        <h1 className="landing__title">
          {isReturning ? `Hallo, ${player.name} 👋` : 'Willkommen'}
        </h1>
        <p className="landing__tagline">
          {isReturning ? 'Bereit für die nächste Runde?' : 'Bereit für eine legendäre Nacht?'}
        </p>

        {/* Resume-Banner */}
        <AnimatePresence>
          {resumableSession && (
            <motion.div
              className="landing__resume"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="landing__resume-content">
                <span className="landing__resume-icon">🎮</span>
                <div>
                  <p className="landing__resume-title">Letztes Spiel</p>
                  <p className="landing__resume-sub">
                    {resumableSession.sessionName || 'Session gefunden'} · Fortsetzen?
                  </p>
                </div>
              </div>
              <div className="landing__resume-actions">
                <button className="btn-primary" onClick={handleResume}>
                  ▶ Fortsetzen
                </button>
                <button className="landing__resume-dismiss" onClick={() => { clearLastSession(); setResumableSession(null) }}>
                  Ignorieren
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Namens-Eingabe: nur anzeigen wenn kein Name gespeichert */}
        {!isReturning && (
          <div className="landing__input-wrap glass">
            <span className="landing__input-icon">👤</span>
            <input
              className="landing__input"
              type="text"
              placeholder="Dein Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canContinue && handleContinue()}
              maxLength={16}
              autoComplete="off"
            />
          </div>
        )}

        <button
          className="btn-primary landing__cta"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Weiter
        </button>

        <p className="landing__disclaimer">Trink verantwortungsvoll.</p>
      </motion.div>
    </div>
  )
}
