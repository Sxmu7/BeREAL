import { useEffect, useState, useRef } from 'react'
import './CircularTimer.css'

/**
 * Countdown als Kreisbogen statt Fortschrittsbalken – zieht das
 * Signature-Kreismotiv konsequent durch. Ruft onComplete genau
 * einmal auf, wenn die Zeit abläuft.
 */
export default function CircularTimer({ totalSeconds, onComplete, size = 96 }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const hasCompleted = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    hasCompleted.current = false
  }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      if (!hasCompleted.current) {
        hasCompleted.current = true
        onComplete?.()
      }
      return
    }
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining, onComplete])

  const radius = size / 2 - 6
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0
  const offset = circumference * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isUrgent = remaining <= 10 && remaining > 0

  return (
    <div
      className={isUrgent ? 'circular-timer circular-timer--urgent' : 'circular-timer'}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-glass)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="circular-timer__label">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
