import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createSession, generatePlayerId } from '../lib/sessions'
import { rememberLastSession } from '../lib/lastSession'
import './HostSetupScreen.css'

const MODES = [
  { value: 'casual', label: 'Casual', desc: 'Entspannt, kein Alkohol nötig' },
  { value: 'party',  label: 'Party',  desc: 'Klassisches Trinkspiel' },
  { value: 'chaos',  label: 'Hardcore', desc: 'Für Mutige' }
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
  { value: 'chaos',  label: 'Chaos' }
]

export default function HostSetupScreen({ player, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [sessionName, setSessionName] = useState(`${player.name || 'Party'} Eskalation`)
  const [mode, setMode] = useState('party')
  const [difficulty, setDifficulty] = useState('medium')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    if (!sessionName.trim() || isCreating) return
    setError(null)
    setIsCreating(true)
    try {
      let hostId = localStorage.getItem('daredrop_player_id')
      if (!hostId) {
        hostId = generatePlayerId()
        localStorage.setItem('daredrop_player_id', hostId)
      }
      const code = await createSession({
        hostId,
        hostName: player.name || 'Host',
        hostCharacterId: player.characterId,
        sessionName: sessionName.trim()
      })
      rememberLastSession(code)
      navigate(`/lobby/${code}`, {
        state: {
          initialSettings: {
            gameMode: mode === 'hardcore' ? 'party' : mode,
            challengeFrequency: mode === 'casual' ? 'chill' : mode === 'chaos' ? 'chaos' : 'party',
            challengeTimer: 180,
            difficulty,
            battleRoundEvery: 5,
            punishmentLevel: mode === 'chaos' ? 'heavy' : 'medium'
          }
        }
      })
    } catch (err) {
      console.error(err)
      setError('Session konnte nicht erstellt werden.')
      setIsCreating(false)
    }
  }

  return (
    <div className="create-game">
      <div className="create-game__header">
        <button className="create-game__back" onClick={() => navigate('/menu')}>
          ‹
        </button>
        <h1 className="create-game__title">Neues Spiel</h1>
        <div style={{ width: 32 }} />
      </div>

      <div className="create-game__body">
        {/* Spielname */}
        <motion.div
          className="create-game__field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="create-game__label">Spielname</label>
          <input
            className="create-game__input glass"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value.slice(0, 32))}
            placeholder="Samstag Eskalation"
          />
        </motion.div>

        {/* Modus */}
        <motion.div
          className="create-game__field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="create-game__label">Modus</label>
          <div className="create-game__modes">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={
                  mode === m.value
                    ? 'create-game__mode create-game__mode--active'
                    : 'create-game__mode'
                }
                onClick={() => setMode(m.value)}
              >
                <span className="create-game__mode-label">{m.label}</span>
                <span className="create-game__mode-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Schwierigkeit */}
        <motion.div
          className="create-game__field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="create-game__label">Schwierigkeit</label>
          <div className="create-game__difficulty">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                className={
                  difficulty === d.value
                    ? 'create-game__diff-btn create-game__diff-btn--active'
                    : 'create-game__diff-btn'
                }
                onClick={() => setDifficulty(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </motion.div>

        {error && <p className="create-game__error">{error}</p>}
      </div>

      <div className="create-game__footer">
        <button
          className="btn-primary"
          disabled={!sessionName.trim() || isCreating}
          onClick={handleCreate}
        >
          {isCreating ? 'Erstelle…' : 'Spiel starten'}
        </button>
      </div>
    </div>
  )
}
