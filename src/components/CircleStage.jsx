import { motion } from 'framer-motion'
import './CircleStage.css'

/**
 * Das wiederkehrende Signature-Motiv von DareDrop: eine kreisförmige
 * Bühne mit Glow. Wird auf der Landing-Page-Vorschau, im Wheel-Screen
 * und in der Lobby (Avatare im Kreis) wiederverwendet.
 */
export default function CircleStage({ children, size = 280, glowColor }) {
  return (
    <div
      className="circle-stage"
      style={{
        width: size,
        height: size,
        '--stage-glow': glowColor || 'var(--color-accent-dim)'
      }}
    >
      <motion.div
        className="circle-stage__ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      <div className="circle-stage__glow" />
      <div className="circle-stage__content">{children}</div>
    </div>
  )
}
