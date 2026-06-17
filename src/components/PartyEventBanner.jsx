import { motion } from 'framer-motion'
import './PartyEventBanner.css'

/**
 * Auffälliger Banner für Party-Events (Brief: "⚠️ PARTY EVENT").
 * Wird oberhalb der normalen Challenge-Karte angezeigt, wenn die
 * aktuelle Runde als Sonderereignis ausgelost wurde.
 */
export default function PartyEventBanner({ event }) {
  if (!event) return null

  return (
    <motion.div
      className="party-event-banner"
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="party-event-banner__tag">⚠️ PARTY EVENT</span>
      <span className="party-event-banner__icon">{event.icon}</span>
      <p className="party-event-banner__title">{event.title}</p>
      <p className="party-event-banner__description">{event.description}</p>
    </motion.div>
  )
}
