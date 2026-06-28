import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BeerAnimation from '../components/BeerAnimation'
import { getLastSessionCode, clearLastSession } from '../lib/lastSession'
import { getSessionOnce } from '../lib/sessions'
import './LandingPage.css'

const FEATURES = [
  { label: 'Challenges' },
  { label: 'Trinkspiel' },
  { label: 'Multiplayer' },
]

export default function LandingPage({ player, setName: setPlayerName }) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('intro')
  const [name, setName] = useState(player?.name || '')
  const [resumableSession, setResumableSession] = useState(undefined)
  const isReturning = !!player?.name

  useEffect(() => {
    const code = getLastSessionCode()
    if (!code) { setResumableSession(null); return }
    getSessionOnce(code)
      .then((d) => {
        if (d && d.status !== 'ended') setResumableSession(d)
        else { clearLastSession(); setResumableSession(null) }
      })
      .catch(() => setResumableSession(null))
  }, [])

  const handleAnimationDone = useCallback(() => {
    setTimeout(() => setPhase('main'), 300)
  }, [])

  function handleContinue() {
    const trimmed = name.trim()
    if (!trimmed && !isReturning) return
    if (trimmed && trimmed !== player?.name) {
      setPlayerName(trimmed)
    }
    navigate('/menu')
  }

  const canContinue = isReturning || name.trim().length >= 2

  return (
    <div className="landing">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="landing__intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <BeerAnimation onComplete={handleAnimationDone} />
          </motion.div>
        )}

        {phase === 'main' && (
          <motion.div
            key="main"
            className="landing__main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo */}
            <motion.div
              className="landing__logo-wrap"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="landing__logo">
                <span className="landing__logo-icon">⚡</span>
              </div>
              <div className="landing__logo-ring" />
            </motion.div>

            {/* Headline */}
            <motion.div
              className="landing__headline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <h1 className="landing__title">
                {isReturning ? `Hey, ${player.name}` : 'RIOT'}
              </h1>
              <p className="landing__tagline">
                Accept the dare. Or take the drink.
              </p>
            </motion.div>

            {/* Resume banner */}
            <AnimatePresence>
              {resumableSession && (
                <motion.div
                  className="landing__resume"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="landing__resume-content">
                    <span className="landing__resume-icon">⚡</span>
                    <div>
                      <p className="landing__resume-title">Laufendes Spiel</p>
                      <p className="landing__resume-sub">
                        {resumableSession.sessionName || 'Session'} · Fortsetzen?
                      </p>
                    </div>
                  </div>
                  <div className="landing__resume-actions">
                    <button
                      className="landing__cta landing__cta--accent"
                      onClick={() => navigate(
                        resumableSession.status === 'active'
                          ? `/game/${resumableSession.code}`
                          : `/lobby/${resumableSession.code}`
                      )}
                    >
                      ▶ Fortsetzen
                    </button>
                    <button
                      className="landing__resume-dismiss"
                      onClick={() => { clearLastSession(); setResumableSession(null) }}
                    >
                      Ignorieren
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <motion.div
              className="landing__input-group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              {!isReturning && (
                <div className="landing__input-wrap">
                  <span className="landing__input-icon">👤</span>
                  <input
                    className="landing__input"
                    type="text"
                    placeholder="Dein Name"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 16))}
                    onKeyDown={(e) => e.key === 'Enter' && canContinue && handleContinue()}
                    maxLength={16}
                    autoComplete="off"
                    autoFocus
                  />
                  <span className="landing__input-counter">{name.trim().length}/16</span>
                </div>
              )}

              {!isReturning && name.length > 0 && !canContinue && (
                <p className="landing__input-hint">Mindestens 2 Zeichen</p>
              )}

              <button
                className="landing__cta"
                onClick={handleContinue}
                disabled={!canContinue}
              >
                {isReturning ? 'Weiter →' : "Los geht's →"}
              </button>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              className="landing__features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {FEATURES.map((f, i) => (
                <span key={i} className="landing__feature-pill">
                  {f.label}
                </span>
              ))}
            </motion.div>

            <p className="landing__disclaimer">Trink verantwortungsvoll.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
