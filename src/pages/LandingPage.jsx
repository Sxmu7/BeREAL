import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BeerAnimation from '../components/BeerAnimation'
import { getLastSessionCode, clearLastSession } from '../lib/lastSession'
import { getSessionOnce } from '../lib/sessions'
import './LandingPage.css'

/**
 * Landing Page mit zwei Phasen:
 * 1. Intro: animierter Bierkrug füllt sich auf (nach Codepen bVKXvj,
 *    neu implementiert mit Framer Motion statt GSAP MorphSVGPlugin).
 *    Übersprungen für wiederkehrende User, da die Animation nur beim
 *    ersten Eindruck Sinn ergibt, danach eher nervt.
 * 2. Main: Willkommens-Screen mit optionaler Namenseingabe,
 *    Resume-Banner falls ein Spiel läuft, und CTA-Button.
 */
export default function LandingPage({ player, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(() =>
    // Wiederkehrende User überspringen die Intro-Animation
    player?.name ? 'main' : 'intro'
  )
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
    // kurze Pause nach der Animation, dann fade ins Main-Content
    setTimeout(() => setPhase('main'), 300)
  }, [])

  function handleContinue() {
    const trimmed = name.trim()
    if (!trimmed && !isReturning) return
    if (trimmed && trimmed !== player?.name) {
      navigate('/name', { state: { prefill: trimmed } })
      return
    }
    navigate(player?.characterId ? '/menu' : '/character')
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
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <BeerAnimation onComplete={handleAnimationDone} />
          </motion.div>
        )}

        {phase === 'main' && (
          <motion.div
            key="main"
            className="landing__main"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Radial-Glow hinter dem Logo */}
            <div className="landing__glow" />

            {/* Logo */}
            <div className="landing__logo">
              <span className="landing__logo-icon">🥃</span>
            </div>

            <h1 className="landing__title">
              {isReturning ? `Hallo, ${player.name} 👋` : 'Willkommen'}
            </h1>
            <p className="landing__tagline">
              {isReturning
                ? 'Bereit für die nächste Runde?'
                : 'Bereit für eine legendäre Nacht?'}
            </p>

            {/* Resume-Banner */}
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
                      className="btn-primary"
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

            {/* Namenseingabe (nur für neue User) */}
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
                  autoFocus
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
        )}
      </AnimatePresence>
    </div>
  )
}
