import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCharacterById } from '../lib/characters'
import { playCountdownTickSound, playCountdownGoSound, vibrate } from '../lib/sounds'
import './RoundCountdown.css'

const PLAYERS_REVEAL_MS = 1100
const COUNT_STEP_MS = 700

/**
 * Spannungsaufbau vor jeder neuen Runde (Brief: "Runden-Spannung").
 * Erst werden kurz alle Spielerbilder eingeblendet ("wer ist als
 * nächstes dran?"), dann läuft ein 3-2-1-Countdown, bevor das Wheel
 * tatsächlich zu drehen beginnt. Ruft onDone genau einmal auf.
 */
export default function RoundCountdown({ players, onDone }) {
  const [phase, setPhase] = useState('players') // 'players' | 'counting' | 'done'
  const [count, setCount] = useState(3)

  useEffect(() => {
    const revealTimeout = setTimeout(() => setPhase('counting'), PLAYERS_REVEAL_MS)
    return () => clearTimeout(revealTimeout)
  }, [])

  useEffect(() => {
    if (phase !== 'counting') return
    if (count <= 0) {
      setPhase('done')
      playCountdownGoSound()
      vibrate(120)
      onDone?.()
      return
    }
    playCountdownTickSound()
    vibrate(30)
    const stepTimeout = setTimeout(() => setCount((c) => c - 1), COUNT_STEP_MS)
    return () => clearTimeout(stepTimeout)
  }, [phase, count, onDone])

  return (
    <div className="round-countdown">
      <AnimatePresence mode="wait">
        {phase === 'players' && (
          <motion.div
            key="players"
            className="round-countdown__players"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="eyebrow">Nächste Runde</span>
            <div className="round-countdown__avatars">
              {players.map((p, i) => (
                <motion.span
                  key={p.id}
                  className="round-countdown__avatar"
                  initial={{ opacity: 0, scale: 0.6, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
                >
                  {getCharacterById(p.characterId)?.icon || '🎮'}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'counting' && count > 0 && (
          <motion.div
            key={`count-${count}`}
            className="round-countdown__number"
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {count}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
