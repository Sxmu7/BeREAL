import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SegmentedControl from '../components/SegmentedControl'
import SettingRow from '../components/SettingRow'
import { createSession, generatePlayerId } from '../lib/sessions'
import './HostSetupScreen.css'

const FREQUENCY_OPTIONS = [
  { value: 'chill', label: 'Chill' },
  { value: 'party', label: 'Party' },
  { value: 'chaos', label: 'Chaos' },
  { value: 'custom', label: 'Custom' }
]

const TIMER_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' }
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'chaos', label: 'Chaos' }
]

const PUNISHMENT_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' }
]

export default function HostSetupScreen({ player }) {
  const navigate = useNavigate()
  const [sessionName, setSessionName] = useState(`${player.name || 'Spieler'}'s Session`)
  const [gameMode, setGameMode] = useState('party')
  const [frequency, setFrequency] = useState('party')
  const [customMin, setCustomMin] = useState(5)
  const [customMax, setCustomMax] = useState(10)
  const [timer, setTimer] = useState(180)
  const [difficulty, setDifficulty] = useState('medium')
  const [battleEvery, setBattleEvery] = useState(5)
  const [punishment, setPunishment] = useState('medium')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
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
        sessionName
      })

      navigate(`/lobby/${code}`, {
        state: {
          initialSettings: {
            gameMode,
            challengeFrequency: frequency,
            customIntervalMin: customMin,
            customIntervalMax: customMax,
            challengeTimer: timer,
            difficulty,
            battleRoundEvery: battleEvery,
            punishmentLevel: punishment
          }
        }
      })
    } catch (err) {
      console.error(err)
      setError(
        'Session konnte nicht erstellt werden. Prüfe die Firebase-Verbindung (siehe README).'
      )
      setIsCreating(false)
    }
  }

  return (
    <div className="host-setup">
      <button className="host-setup__back" onClick={() => navigate('/menu')}>
        ← Zurück
      </button>

      <h1 className="host-setup__title">Session konfigurieren</h1>

      <div className="host-setup__scroll">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="host-setup__section glass"
        >
          <SettingRow label="Session-Name">
            <input
              className="host-setup__text-input"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value.slice(0, 32))}
              placeholder="Session-Name"
            />
          </SettingRow>

          <SettingRow
            label="Game Mode"
            description={
              gameMode === 'party'
                ? 'Strafen sind Schlucke/Shots'
                : 'Keine Strafen mit Alkohol – nur Punktabzug'
            }
          >
            <SegmentedControl
              options={[
                { value: 'party', label: 'Party' },
                { value: 'casual', label: 'Casual' }
              ]}
              value={gameMode}
              onChange={setGameMode}
            />
          </SettingRow>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="host-setup__section glass"
        >
          <SettingRow
            label="Challenge Frequency"
            description={
              frequency === 'chill'
                ? 'Alle 10–20 Minuten'
                : frequency === 'party'
                ? 'Alle 5–10 Minuten'
                : frequency === 'chaos'
                ? 'Alle 3–7 Minuten'
                : 'Eigenes Intervall festlegen'
            }
          >
            <SegmentedControl
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={setFrequency}
            />
          </SettingRow>

          {frequency === 'custom' && (
            <SettingRow label="Eigenes Intervall (Minuten)">
              <div className="host-setup__range-row">
                <input
                  type="number"
                  min={1}
                  max={59}
                  className="host-setup__number-input"
                  value={customMin}
                  onChange={(e) => setCustomMin(Number(e.target.value))}
                />
                <span className="host-setup__range-sep">bis</span>
                <input
                  type="number"
                  min={customMin}
                  max={60}
                  className="host-setup__number-input"
                  value={customMax}
                  onChange={(e) => setCustomMax(Number(e.target.value))}
                />
              </div>
            </SettingRow>
          )}

          <SettingRow label="Challenge Timer">
            <SegmentedControl
              options={TIMER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={timer}
              onChange={setTimer}
            />
          </SettingRow>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="host-setup__section glass"
        >
          <SettingRow label="Difficulty">
            <SegmentedControl
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
            />
          </SettingRow>

          <SettingRow
            label="Battle Rounds"
            description="Alle X Runden bekommen alle Spieler die gleiche Challenge"
          >
            <SegmentedControl
              options={[
                { value: 0, label: 'Aus' },
                { value: 3, label: 'Alle 3' },
                { value: 5, label: 'Alle 5' },
                { value: 8, label: 'Alle 8' }
              ]}
              value={battleEvery}
              onChange={setBattleEvery}
            />
          </SettingRow>

          {gameMode === 'party' && (
            <SettingRow label="Punishment Level">
              <SegmentedControl
                options={PUNISHMENT_OPTIONS}
                value={punishment}
                onChange={setPunishment}
              />
            </SettingRow>
          )}
        </motion.div>

        {error && <p className="host-setup__error">{error}</p>}
      </div>

      <div className="host-setup__actions">
        <button
          className="btn-primary"
          disabled={!sessionName.trim() || isCreating}
          onClick={handleCreate}
        >
          {isCreating ? 'Erstelle Session…' : 'Lobby erstellen'}
        </button>
      </div>
    </div>
  )
}
