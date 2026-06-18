import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './FullscreenTimer.css'

const URGENT_THRESHOLD_SECONDS = 10
const FULLSCREEN_MOMENT_MS = 1800

export default function FullscreenTimer({ totalSeconds, onComplete, label }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [drawComplete, setDrawComplete] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    setDrawComplete(false)
    setIsMinimized(false)
    hasCompletedRef.current = false
    const drawTimeout = setTimeout(() => setDrawComplete(true), 700)
    const minimizeTimeout = setTimeout(() => setIsMinimized(true), FULLSCREEN_MOMENT_MS)
    return () => { clearTimeout(drawTimeout); clearTimeout(minimizeTimeout) }
  }, [totalSeconds])

  useEffect(() => {
    if (!drawComplete) return
    if (remaining <= 0) {
      if (!hasCompletedRef.current) { hasCompletedRef.current = true; onComplete?.() }
      return
    }
    const interval = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(interval)
  }, [remaining, drawComplete, onComplete])

  const size = isMinimized ? 36 : 220
  const radius = size / 2 - (isMinimized ? 4 : 10)
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0
  const countdownOffset = circumference * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isUrgent = remaining <= URGENT_THRESHOLD_SECONDS && remaining > 0
  const strokeColor = isUrgent ? '#ef4444' : isMinimized ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.9)'
  const trackColor = isMinimized ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'

  if (isMinimized) {
    // Bottom-Bar: schmaler Streifen am unteren Rand mit Progressbar + Zeit
    return (
      <motion.div
        className="ftimer-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ftimer-bar__inner">
          <div className="ftimer-bar__left">
            {/* Mini-Ring */}
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              <circle cx="18" cy="18" r={radius} fill="none" stroke={trackColor} strokeWidth="3" />
              <circle
                cx="18" cy="18" r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={countdownOffset}
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
          </div>

          <div className="ftimer-bar__center">
            {label && <span className="ftimer-bar__label">{label}</span>}
            <div className="ftimer-bar__track">
              <motion.div
                className={isUrgent ? 'ftimer-bar__fill ftimer-bar__fill--urgent' : 'ftimer-bar__fill'}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>

          <motion.span
            className={isUrgent ? 'ftimer-bar__time ftimer-bar__time--urgent' : 'ftimer-bar__time'}
            animate={isUrgent ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
            transition={{ duration: 0.6, repeat: isUrgent ? Infinity : 0 }}
          >
            {minutes}:{String(seconds).padStart(2, '0')}
          </motion.span>
        </div>
      </motion.div>
    )
  }

  // Fullscreen-Moment: großer zentrierter Kreis mit Aufzeichnungsanimation
  return (
    <div className="ftimer-fullscreen">
      <div className="ftimer-fullscreen__backdrop" />
      {label && <span className="ftimer-fullscreen__label eyebrow">{label}</span>}
      <div className="ftimer-fullscreen__ring-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={trackColor} strokeWidth="4" />
          {!drawComplete ? (
            <motion.circle
              cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : (
            <circle
              cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={countdownOffset}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          )}
        </svg>
        <motion.span
          className={isUrgent ? 'ftimer-fullscreen__time ftimer-fullscreen__time--urgent' : 'ftimer-fullscreen__time'}
          animate={isUrgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </motion.span>
      </div>
    </div>
  )
}
