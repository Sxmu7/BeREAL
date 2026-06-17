import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CircleStage from '../components/CircleStage'
import FloatingDots from '../components/FloatingDots'
import ThemeToggle from '../components/ThemeToggle'
import { getLastSessionCode, clearLastSession } from '../lib/lastSession'
import { getSessionOnce } from '../lib/sessions'
import './LandingPage.css'

const PREVIEW_STEPS = [
  { key: 'spin', label: 'Wheel Spin' },
  { key: 'challenge', label: 'Challenge' },
  { key: 'proof', label: 'Video Proof' },
  { key: 'vote', label: 'Voting' },
  { key: 'winner', label: 'Winner' }
]

function StepContent({ step }) {
  switch (step) {
    case 'spin':
      return (
        <>
          <span className="preview-emoji">🔥</span>
          <p className="preview-label">Samuel</p>
        </>
      )
    case 'challenge':
      return (
        <>
          <span className="eyebrow">Challenge</span>
          <p className="preview-text">
            Selfie mit jemandem in Sonnenbrille
          </p>
        </>
      )
    case 'proof':
      return (
        <>
          <span className="preview-emoji">🎥</span>
          <p className="preview-label">Aufnahme läuft…</p>
        </>
      )
    case 'vote':
      return (
        <>
          <span className="eyebrow">Geschafft?</span>
          <div className="preview-vote-row">
            <span className="preview-vote-option">Ja</span>
            <span className="preview-vote-option">Nein</span>
          </div>
        </>
      )
    case 'winner':
      return (
        <>
          <span className="preview-emoji">🏆</span>
          <p className="preview-label">Samuel gewinnt</p>
        </>
      )
    default:
      return null
  }
}

export default function LandingPage({ player, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [resumableSession, setResumableSession] = useState(undefined) // undefined = noch am Prüfen

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % PREVIEW_STEPS.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  // Beim Laden einmalig prüfen, ob es eine fortsetzbare Session gibt.
  // "Letztes Spiel fortsetzen" – falls die App versehentlich geschlossen
  // wurde, soll man nicht von Null anfangen müssen. Wir zeigen das nur
  // an, wenn die Session noch existiert und nicht bereits beendet ist;
  // sonst würde nach jeder regulär abgeschlossenen Party dauerhaft ein
  // Banner auftauchen.
  useEffect(() => {
    const lastCode = getLastSessionCode()
    if (!lastCode) {
      setResumableSession(null)
      return
    }
    getSessionOnce(lastCode)
      .then((data) => {
        if (data && data.status !== 'ended') {
          setResumableSession(data)
        } else {
          clearLastSession()
          setResumableSession(null)
        }
      })
      .catch(() => setResumableSession(null))
  }, [])

  function handleResume() {
    if (!resumableSession) return
    const path =
      resumableSession.status === 'active'
        ? `/game/${resumableSession.code}`
        : `/lobby/${resumableSession.code}`
    navigate(path)
  }

  function handleDismissResume() {
    clearLastSession()
    setResumableSession(null)
  }

  function handleStart() {
    // Wer schon einen Namen gespeichert hat, muss ihn nicht erneut
    // eingeben – direkt ins Hauptmenü statt zur Namenseingabe.
    navigate(player?.name ? '/menu' : '/name')
  }

  const currentStep = PREVIEW_STEPS[stepIndex]

  return (
    <div className="landing">
      <FloatingDots count={8} />

      <div className="landing__theme-toggle">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="landing__content">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="landing__hero"
        >
          <h1 className="landing__title">DareDrop</h1>
          <p className="landing__tagline">
            {player?.name
              ? `🍻 Schön, dass du wieder da bist, ${player.name}`
              : 'Accept the dare. Or take the drink.'}
          </p>
        </motion.div>

        {resumableSession && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="landing__resume glass"
          >
            <p className="landing__resume-text">
              Es wurde ein laufendes Spiel gefunden
              {resumableSession.sessionName ? `: „${resumableSession.sessionName}“` : '.'}
            </p>
            <div className="landing__resume-actions">
              <button className="btn-primary" onClick={handleResume}>
                ▶ Spiel fortsetzen
              </button>
              <button className="landing__resume-dismiss" onClick={handleDismissResume}>
                ✕ Neues Spiel starten
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="landing__stage-wrap"
        >
          <CircleStage size={240}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="preview-step"
              >
                <StepContent step={currentStep.key} />
              </motion.div>
            </AnimatePresence>
          </CircleStage>

          <div className="landing__dots">
            {PREVIEW_STEPS.map((s, i) => (
              <span
                key={s.key}
                className={
                  i === stepIndex ? 'landing__dot landing__dot--active' : 'landing__dot'
                }
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="landing__actions"
        >
          <button className="btn-primary" onClick={handleStart}>
            Start
          </button>
          <button className="btn-secondary" onClick={() => navigate('/rules')}>
            Rules
          </button>
        </motion.div>
      </div>
    </div>
  )
}
