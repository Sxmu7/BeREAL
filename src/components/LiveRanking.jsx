import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCharacterById } from '../lib/characters'
import { ensurePlayerStats } from '../lib/rounds'
import './LiveRanking.css'

const MEDALS = ['🥇', '🥈', '🥉']

/**
 * Kompakte Live-Rangliste während des laufenden Spiels (Brief:
 * "Nicht störend. Immer schnell erreichbar."). Standardmäßig
 * eingeklappt zu einem kleinen Pill-Button mit dem aktuellen
 * Spitzenreiter, per Tap klappt die volle Liste aus.
 */
export default function LiveRanking({ players, stats }) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...players].sort(
    (a, b) => ensurePlayerStats(stats, b.id).wins - ensurePlayerStats(stats, a.id).wins
  )
  const leader = sorted[0]
  const leaderWins = leader ? ensurePlayerStats(stats, leader.id).wins : 0

  return (
    <div className="live-ranking">
      <button className="live-ranking__toggle" onClick={() => setExpanded((v) => !v)}>
        {leader && leaderWins > 0 ? (
          <>
            <span className="live-ranking__toggle-medal">🥇</span>
            <span className="live-ranking__toggle-name">{leader.name}</span>
          </>
        ) : (
          <span className="live-ranking__toggle-name">Rangliste</span>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="live-ranking__panel glass"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {sorted.map((p, i) => {
              const s = ensurePlayerStats(stats, p.id)
              const character = getCharacterById(p.characterId)
              return (
                <div key={p.id} className="live-ranking__row">
                  <span className="live-ranking__rank">{MEDALS[i] || `${i + 1}.`}</span>
                  <span className="live-ranking__icon">{character?.icon || '🎮'}</span>
                  <span className="live-ranking__name">{p.name}</span>
                  <span className="live-ranking__score">{s.wins}</span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
