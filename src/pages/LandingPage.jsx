import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BeerAnimation from '../components/BeerAnimation'
import { getLastSessionCode, clearLastSession } from '../lib/lastSession'
import { getSessionOnce } from '../lib/sessions'
import './LandingPage.css'

const FEATURES = [
  { icon: '🎯', label: 'Challenges' },
  { icon: '🍻', label: 'Trinkspiel' },
  { icon: '🎮', label: 'Multiplayer' },
]

export default function LandingPage({ player }) {
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
      navigate('/name', { state: { prefill: trimmed } })
      return
    }
    navigate('/menu')
  }

  const canContinue = isReturning || name.trim().length >= 2

  return (
    <div className="landing">
      {/* Atmosphäre-Schichten */}
      <div className="landing__bg-glow-1" />
      <div className="landing__bg-glow-2" />
      <div className="landing__bg-glow-3" />
      <div className="landing__grid" />

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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo mit Ringen */}
            <motion.div
              className="landing__logo-wrap"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="landing__logo-ring-2" />
              <div className="landing__logo-ring" />
              <div className="landing__logo">🥃</div>
            </motion.div>

            {/* Headline */}
            <motion.div
              className="landing__headline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="landing__title">
                {isReturning ? `Hey, ${player.name} 👋` : 'Willkommen'}
              </h1>
              <p className="landing__tagline">
                {isReturning
                  ? 'Bereit für die nächste Runde?'
                  : 'Bereit für eine legendäre Nacht?'}
              </p>
            </motion.div>

            {/* Resume-Banner */}
            <AnimatePresence>
              {resumableSession && (
                <motion.div
                  className="landing__resume"
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="landing__resume-content">
                    <span className="landing__resume-icon">🎮</span>
                    <div>
                      <p className="landing__resume-title">Laufendes Spiel gefunden</p>
                      <p className="landing__resume-sub">
                        {resumableSession.sessionName || 'Session'} · Fortsetzen?
                      </p>
                    </div>
                  </div>
                  <div className="landing__resume-actions">
                    <button
                      className="landing__cta"
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

            {/* Input-Gruppe */}
            <motion.div
              className="landing__input-group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ width: '100%' }}
            >
              {!isReturning && (
                <div className="landing__input-wrap">
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
                    autoFocus
                  />
                </div>
              )}

              <button
                className="landing__cta"
                onClick={handleContinue}
                disabled={!canContinue}
              >
                Weiter
              </button>
            </motion.div>

            {/* Feature-Pills */}
            <motion.div
              className="landing__features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {FEATURES.map((f, i) => (
                <span key={i} className="landing__feature-pill">
                  <span className="landing__feature-dot" />
                  {f.icon} {f.label}
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
