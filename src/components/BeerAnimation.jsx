import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BeerAnimation.css'

/**
 * Animierter Bierkrug — nach dem Codepen von Lionel Tzatzkin (bVKXvj).
 * Original nutzt GSAP MorphSVGPlugin (kommerziell). Diese Version
 * repliziert die visuelle Wirkung mit Framer Motion:
 * 1. Flüssigkeit "füllt" den Krug von unten auf (clipPath-Animation)
 * 2. Schaum bricht oben heraus und wackelt
 * 3. Bubbles erscheinen
 * 4. Logo-Text blendet ein
 *
 * Farbpalette ans App-Design angepasst: Indigo/Violet statt Amber.
 */
export default function BeerAnimation({ onComplete }) {
  const [fillPercent, setFillPercent] = useState(0)
  const [showFoam, setShowFoam] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)
  const [showText, setShowText] = useState(false)
  const [foamWave, setFoamWave] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const FILL_DURATION = 1400
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const p = Math.min(elapsed / FILL_DURATION, 1)
      // Easing: easeOutQuart
      const eased = 1 - Math.pow(1 - p, 4)
      setFillPercent(eased * 100)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setShowFoam(true)
        setTimeout(() => setShowBubbles(true), 200)
        setTimeout(() => setShowText(true), 500)
        setTimeout(() => onComplete?.(), 900)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [onComplete])

  // Schaum-Wellen-Animation
  useEffect(() => {
    if (!showFoam) return
    let dir = 1
    const interval = setInterval(() => {
      setFoamWave(v => {
        const next = v + dir * 0.3
        if (next > 1 || next < 0) dir *= -1
        return Math.max(0, Math.min(1, next))
      })
    }, 50)
    return () => clearInterval(interval)
  }, [showFoam])

  // SVG-Koordinaten des Glases (aus Original übernommen, leicht skaliert)
  const GLASS_X = 176, GLASS_Y = 140, GLASS_W = 160, GLASS_H = 230
  // Flüssigkeitsfläche: füllt von unten
  const fillY = GLASS_Y + GLASS_H - (GLASS_H * fillPercent / 100)
  const fillH = GLASS_H * fillPercent / 100

  // Foam-Kurve: einfache quadratische Bézierkurve die wackelt
  const foamMid = 255 + foamWave * 16 - 8
  const foamPath = `M180,${fillY} Q256,${foamMid - (showFoam ? 28 : 0)} 332,${fillY} L332,${fillY - (showFoam ? 24 : 0)} Q256,${foamMid - (showFoam ? 52 : 0)} 180,${fillY - (showFoam ? 24 : 0)} Z`

  return (
    <div className="beer-anim">
      <svg viewBox="0 0 512 512" className="beer-anim__svg">
        <defs>
          <clipPath id="beer-clip">
            <path d="M313.8,159.7h-116c-4.6,0-8.4,3.7-8.4,8.4l13.1,180c0,4.6,3.7,8.4,8.4,8.4h87.2c4.6,0,8.4-3.7,8.4-8.4 l15.7-180C322.2,163.4,318.5,159.7,313.8,159.7z"/>
          </clipPath>
          <linearGradient id="beer-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </linearGradient>
          <linearGradient id="beer-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.4)"/>
            <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
          </linearGradient>
          <filter id="beer-blur">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Hintergrund */}
        <rect width="512" height="512" fill="#0d0f14"/>

        {/* Ambientes Glow hinter dem Glas */}
        <ellipse
          cx="256" cy="380"
          rx={60 * fillPercent / 100}
          ry={20 * fillPercent / 100}
          fill="url(#beer-glow)"
          opacity="0.6"
        />

        {/* Flüssigkeit (geclippt auf Glasform) */}
        <g clipPath="url(#beer-clip)">
          <motion.rect
            x="180"
            y={fillY}
            width="152"
            height={fillH + 20}
            fill="url(#beer-liquid)"
            initial={false}
          />

          {/* Schaum */}
          <AnimatePresence>
            {showFoam && (
              <motion.path
                d={foamPath}
                fill="rgba(255,255,255,0.85)"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Highlight: heller Schimmer links */}
          <rect
            x="192" y="165" width="18" height={fillH}
            fill="rgba(255,255,255,0.08)"
            rx="9"
          />
        </g>

        {/* Bubbles */}
        <AnimatePresence>
          {showBubbles && [
            { cx: 233, cy: 338, r: 2.1, delay: 0 },
            { cx: 255, cy: 310, r: 1.7, delay: 0.1 },
            { cx: 270, cy: 330, r: 1.3, delay: 0.2 },
            { cx: 245, cy: 295, r: 1.8, delay: 0.05 },
            { cx: 262, cy: 345, r: 1.0, delay: 0.15 },
          ].map((b, i) => (
            <motion.ellipse
              key={i}
              cx={b.cx} cy={b.cy} rx={b.r} ry={b.r}
              fill="rgba(255,255,255,0.5)"
              initial={{ opacity: 0, cy: b.cy + 10 }}
              animate={{ opacity: [0, 0.7, 0], cy: b.cy - 30 }}
              transition={{ duration: 2.5, delay: b.delay, repeat: Infinity, repeatDelay: 1.5 }}
            />
          ))}
        </AnimatePresence>

        {/* Glas-Overlay (semi-transparent weiß für Glas-Optik) */}
        <path
          className="beer-anim__glass"
          d="M313.3,367.7h-116c-3,0-5.4-2.4-5.4-5.4L173,149.7c0-3,2.4-5.4,5.4-5.4h155.2c3,0,5.4,2.4,5.4,5.4l-20.2,212.5C318.8,365.3,316.3,367.7,313.3,367.7z"
        />
        <polygon
          className="beer-anim__glass"
          points="186.5,144.3 204.3,367.7 235.9,367.7 218.1,144.3"
        />

        {/* DareDrop Logo-Text */}
        <AnimatePresence>
          {showText && (
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <text
                x="256" y="430"
                textAnchor="middle"
                fontSize="32"
                fontWeight="800"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                letterSpacing="-1"
                fill="white"
              >
                DareDrop
              </text>
              <text
                x="256" y="455"
                textAnchor="middle"
                fontSize="13"
                fontWeight="500"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                fill="rgba(255,255,255,0.45)"
                letterSpacing="2"
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
