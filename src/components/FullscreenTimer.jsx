import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import './FullscreenTimer.css'

const URGENT_THRESHOLD_SECONDS = 10
const FULLSCREEN_MOMENT_MS = 1800 // wie lange der Timer beim Start groß/zentral bleibt

/**
 * Zeigt beim Start eines Timers (Challenge-Entscheidung, Abstimmung)
 * kurz ein Vollbild-Moment: der Kreis zeichnet sich groß und zentral
 * auf, damit alle Spieler merken "jetzt läuft die Zeit". Danach zieht
 * sich der Timer auf eine kompakte, nicht-blockierende Position oben
 * zusammen, damit die eigentlichen Buttons/Inhalte wieder bedienbar
 * sind – ein dauerhaftes Vollbild-Overlay würde sonst die Annahme-
 * oder Voting-Buttons darunter blockieren. Wird die Zeit knapp, färbt
 * sich die Zifferanzeige rot. Ruft onComplete genau einmal auf.
 */
export default function FullscreenTimer({ totalSeconds, onComplete, label }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [drawComplete, setDrawComplete] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const hasCompletedRef = useRef(false)

  // Eröffnungs-Animation: Kreis zeichnet sich einmal komplett auf,
  // bevor der eigentliche Countdown beginnt.
  useEffect(() => {
    setRemaining(totalSeconds)
    setDrawComplete(false)
    setIsMinimized(false)
    hasCompletedRef.current = false
    const drawTimeout = setTimeout(() => setDrawComplete(true), 700)
    const minimizeTimeout = setTimeout(() => setIsMinimized(true), FULLSCREEN_MOMENT_MS)
    return () => {
      clearTimeout(drawTimeout)
      clearTimeout(minimizeTimeout)
    }
  }, [totalSeconds])

  useEffect(() => {
    if (!drawComplete) return
    if (remaining <= 0) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onComplete?.()
      }
      return
    }
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining, drawComplete, onComplete])

  const size = isMinimized ? 64 : 240
  const radius = size / 2 - (isMinimized ? 5 : 10)
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0
  const countdownOffset = circumference * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isUrgent = remaining <= URGENT_THRESHOLD_SECONDS && remaining > 0

  return (
    <motion.div
      className={isMinimized ? 'fullscreen-timer fullscreen-timer--mini' : 'fullscreen-timer'}
      layout
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {!isMinimized && <div className="fullscreen-timer__backdrop" />}

      {!isMinimized && label && (
        <span className="fullscreen-timer__label eyebrow">{label}</span>
      )}

      <motion.div
        className="fullscreen-timer__ring-wrap"
        layout
        animate={{ width: size, height: size }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border-glass)"
            strokeWidth={isMinimized ? 3 : 4}
          />

          {!drawComplete ? (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isUrgent ? 'var(--color-danger)' : 'var(--color-text-primary)'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isUrgent ? 'var(--color-danger)' : 'var(--color-text-primary)'}
              strokeWidth={isMinimized ? 3 : 4}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={countdownOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          )}
        </svg>

        <motion.span
          className={
            isUrgent
              ? 'fullscreen-timer__time fullscreen-timer__time--urgent'
              : 'fullscreen-timer__time'
          }
          animate={isUrgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
          style={isMinimized ? { fontSize: '0.8125rem' } : undefined}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}
