import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCharacterById } from '../lib/characters'
import './WheelSpin.css'

/**
 * Alle Geräte zeigen die gleiche Animation und landen synchron auf
 * dem vom Server bereits bestimmten Spieler (selectedPlayerId).
 * Das Wheel ist rein visuell – siehe Brief: "Wheel is visual only."
 */
export default function WheelSpin({ players, selectedPlayerId, onSpinComplete }) {
  const [hasLanded, setHasLanded] = useState(false)
  const selectedIndex = players.findIndex((p) => p.id === selectedPlayerId)
  const segmentAngle = 360 / players.length
  // Mehrere volle Umdrehungen + Ziel-Segment nach oben drehen
  const targetRotation = 360 * 4 + (360 - selectedIndex * segmentAngle)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasLanded(true)
      onSpinComplete?.()
    }, 2600)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="wheel-spin">
      <motion.div
        className="wheel-spin__ring"
        animate={{ rotate: targetRotation }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {players.map((p, i) => {
          const angle = segmentAngle * i
          const character = getCharacterById(p.characterId)
          return (
            <div
              key={p.id}
              className="wheel-spin__segment"
              style={{ transform: `rotate(${angle}deg) translate(0, -42%)` }}
            >
              <span
                className="wheel-spin__segment-icon"
                style={{ transform: `rotate(${-angle}deg)` }}
              >
                {character?.icon || '🎮'}
              </span>
            </div>
          )
        })}
      </motion.div>

      <div className="wheel-spin__pointer" />

      <div className="wheel-spin__center glass">
        {hasLanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="wheel-spin__result"
          >
            <span className="wheel-spin__result-icon">
              {getCharacterById(players[selectedIndex]?.characterId)?.icon || '🎮'}
            </span>
            <span className="wheel-spin__result-name">
              {players[selectedIndex]?.name}
            </span>
          </motion.div>
        ) : (
          <span className="eyebrow">Wer ist dran…</span>
        )}
      </div>
    </div>
  )
}
