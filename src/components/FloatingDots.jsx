import { useMemo } from 'react'
import { motion } from 'framer-motion'
import './FloatingDots.css'

/**
 * Dezente schwebende Punkte im Hintergrund. Bewusst sparsam (wenige,
 * kleine, langsame Punkte statt eines auffälligen Partikel-Feldes),
 * damit es zur zurückhaltenden Apple-Ästhetik passt und den Inhalt
 * im Vordergrund nicht stört. Funktioniert in Light und Dark Mode
 * über die --color-dot Variable.
 */
export default function FloatingDots({ count = 7 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        size: 3 + Math.random() * 5,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        duration: 18 + Math.random() * 14,
        delay: Math.random() * -20
      })),
    [count]
  )

  return (
    <div className="floating-dots" aria-hidden="true">
      {dots.map((dot) => (
        <motion.span
          key={dot.id}
          className="floating-dots__dot"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.startX}%`,
            top: `${dot.startY}%`
          }}
          animate={{
            y: [0, -26, 0, 18, 0],
            x: [0, 14, -10, 6, 0],
            opacity: [0.3, 0.7, 0.4, 0.6, 0.3]
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}
