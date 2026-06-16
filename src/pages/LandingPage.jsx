import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CircleStage from '../components/CircleStage'
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

export default function LandingPage() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % PREVIEW_STEPS.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  const currentStep = PREVIEW_STEPS[stepIndex]

  return (
    <div className="landing">
      <div className="landing__bg" />

      <div className="landing__content">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="landing__hero"
        >
          <h1 className="landing__title">DareDrop</h1>
          <p className="landing__tagline">
            Accept the dare. Or take the drink.
          </p>
        </motion.div>

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
          <button className="btn-primary" onClick={() => navigate('/name')}>
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
