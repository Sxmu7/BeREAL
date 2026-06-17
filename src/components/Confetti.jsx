import { useMemo } from 'react'
import { motion } from 'framer-motion'
import './Confetti.css'

const COLORS = ['#0071e3', '#30d158', '#ffd60a', '#ff453a', '#bf5af2']

/**
 * Kurzer Konfetti-Effekt für Erfolgsmomente (Brief: "Konfetti bei
 * Erfolgen"). Rein CSS/Framer-Motion-basiert, keine externe
 * Konfetti-Bibliothek nötig. Partikel fallen einmalig von oben nach
 * unten und verschwinden danach von selbst (kein Cleanup-Handler
 * nötig, die Komponente wird einfach aus dem Tree entfernt).
 */
export default function Confetti({ count = 24 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        duration: 1.4 + Math.random() * 0.8,
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 80
      })),
    [count]
  )

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="confetti__piece"
          style={{ left: `${p.left}%`, background: p.color }}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 360, x: p.drift, opacity: 0, rotate: p.rotation }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
