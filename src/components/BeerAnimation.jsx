import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BeerAnimation.css'

export default function BeerAnimation({ onComplete }) {
  const [fillPercent, setFillPercent] = useState(0)
  const [showFoam, setShowFoam] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)
  const [showText, setShowText] = useState(false)
  const [foamWave, setFoamWave] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const FILL_DURATION = 1600
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const p = Math.min(elapsed / FILL_DURATION, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setFillPercent(eased * 100)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setShowFoam(true)
        setTimeout(() => setShowBubbles(true), 300)
        setTimeout(() => setShowText(true), 600)
        setTimeout(() => onComplete?.(), 1100)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [onComplete])

  useEffect(() => {
    if (!showFoam) return
    let dir = 1
    const interval = setInterval(() => {
      setFoamWave(v => {
        const next = v + dir * 0.25
        if (next > 1 || next < 0) dir *= -1
        return Math.max(0, Math.min(1, next))
      })
    }, 50)
    return () => clearInterval(interval)
  }, [showFoam])

  const GLASS_Y = 140, GLASS_H = 228
  const fillY = GLASS_Y + GLASS_H - (GLASS_H * fillPercent / 100)
  const fillH = GLASS_H * fillPercent / 100

  const foamOffset = showFoam ? 28 : 0
  const foamMid = 256 + (foamWave - 0.5) * 18
  const foamPath = `M183,${fillY} Q${foamMid},${fillY - foamOffset} 329,${fillY} L329,${fillY - foamOffset * 0.85} Q${foamMid},${fillY - foamOffset * 1.8} 183,${fillY - foamOffset * 0.85} Z`

  return (
    <div className="beer-anim">
      <svg viewBox="0 0 512 512" className="beer-anim__svg">
        <defs>
          <clipPath id="beer-clip">
            <path d="M313.8,159.7h-116c-4.6,0-8.4,3.7-8.4,8.4l13.1,180c0,4.6,3.7,8.4,8.4,8.4h87.2c4.6,0,8.4-3.7,8.4-8.4 l15.7-180C322.2,163.4,318.5,159.7,313.8,159.7z"/>
          </clipPath>
          <linearGradient id="beer-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#4f46e5"/>
          </linearGradient>
          <radialGradient id="beer-glow-rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.5)"/>
            <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
          </radialGradient>
        </defs>

        {/* Hintergrund exakt gleiche Farbe wie Landing-Page — kein Absetzen */}
        <rect width="512" height="512" fill="#0d0f14"/>

        {/* Glow-Ellipse unter dem Glas, wächst mit der Füllung */}
        <ellipse
          cx="256" cy="388"
          rx={Math.max(0, 72 * fillPercent / 100)}
          ry={Math.max(0, 18 * fillPercent / 100)}
          fill="url(#beer-glow-rg)"
          opacity="0.7"
        />

        {/* Flüssigkeit im Glas */}
        <g clipPath="url(#beer-clip)">
          <rect
            x="180" y={fillY}
            width="152" height={fillH + 20}
            fill="url(#beer-liquid)"
          />

          {/* Schimmer-Highlight links */}
          {fillH > 5 && (
            <rect
              x="193" y={Math.max(fillY, 165)}
              width="16" height={Math.max(0, fillH - 4)}
              fill="rgba(255,255,255,0.1)"
              rx="8"
            />
          )}

          {/* Schaum */}
          <AnimatePresence>
            {showFoam && (
              <motion.path
                d={foamPath}
                fill="rgba(255,255,255,0.88)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              />
            )}
          </AnimatePresence>
        </g>

        {/* Bubbles */}
        {showBubbles && [
          { cx: 237, cy: 340, r: 2.2, delay: 0 },
          { cx: 258, cy: 312, r: 1.6, delay: 0.12 },
          { cx: 272, cy: 332, r: 1.2, delay: 0.24 },
          { cx: 248, cy: 298, r: 1.8, delay: 0.06 },
          { cx: 264, cy: 350, r: 1.0, delay: 0.18 },
        ].map((b, i) => (
          <motion.ellipse
            key={i}
            cx={b.cx} cy={b.cy} rx={b.r} ry={b.r}
            fill="rgba(255,255,255,0.55)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.75, 0], y: [-28, -28] }}
            transition={{ duration: 2.2, delay: b.delay, repeat: Infinity, repeatDelay: 1.8 }}
          />
        ))}

        {/* Glas-Overlay — semi-transparent für Glasoptik */}
        <path
          className="beer-anim__glass"
          d="M313.3,367.7h-116c-3,0-5.4-2.4-5.4-5.4L173,149.7c0-3,2.4-5.4,5.4-5.4h155.2c3,0,5.4,2.4,5.4,5.4l-20.2,212.5C318.8,365.3,316.3,367.7,313.3,367.7z"
        />
        <polygon
          className="beer-anim__glass"
          points="186.5,144.3 204.3,367.7 235.9,367.7 218.1,144.3"
        />

        {/* Text erscheint nach der Füllung */}
        <AnimatePresence>
          {showText && (
            <motion.g
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <text
                x="256" y="428"
                textAnchor="middle"
                fontSize="30"
                fontWeight="800"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                letterSpacing="-0.5"
                fill="rgba(255,255,255,0.95)"
              >
                DareDrop
              </text>
              <text
                x="256" y="452"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                fill="rgba(255,255,255,0.35)"
                letterSpacing="3"
              >
                ACCEPT THE DARE
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  )
}
