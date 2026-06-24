import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createSession, generatePlayerId, updateSessionSettings } from '../lib/sessions'
import { rememberLastSession } from '../lib/lastSession'
import { LOCATION_MODES } from '../lib/challenges'
import './HostSetupScreen.css'

const MODES = [
  { value: 'casual', label: 'Casual', desc: 'Kein Alkohol nötig', icon: '😌' },
  { value: 'party', label: 'Party', desc: 'Klassisches Trinkspiel', icon: '🍻' },
  { value: 'chaos', label: 'Hardcore', desc: 'Für Mutige', icon: '🔥' }
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'chaos', label: 'Chaos' }
]

const FREQUENCY_OPTIONS = [
  { value: 3, label: '3 min', desc: 'Sehr oft' },
  { value: 5, label: '5 min', desc: 'Normal' },
  { value: 10, label: '10 min', desc: 'Selten' },
  { value: 15, label: '15 min', desc: 'Entspannt' },
]

const TIMER_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
]

const PUNISHMENT_OPTIONS = [
  { value: 'mild', label: 'Mild', desc: '1 Schluck' },
  { value: 'medium', label: 'Medium', desc: '2–3 Schlucke' },
  { value: 'heavy', label: 'Heavy', desc: 'Shot' },
]

const LANGUAGE_OPTIONS = [
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'en', label: '🇬🇧 English' },
]

export default function HostSetupScreen({ player }) {
  const navigate = useNavigate()
  const [sessionName, setSessionName] = useState(`${player.name || 'Party'} Night`)
  const [locationMode, setLocationMode] = useState('houseparty')
  const [mode, setMode] = useState('party')
  const [difficulty, setDifficulty] = useState('medium')
  const [frequency, setFrequency] = useState(5)
  const [timer, setTimer] = useState(60)
  const [punishment, setPunishment] = useState('medium')
  const [language, setLanguage] = useState('de')
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
      const settings = {
        gameMode: mode === 'chaos' ? 'party' : mode,
        challengeFrequency: frequency <= 3 ? 'chaos' : frequency <= 5 ? 'party' : 'chill',
        challengeIntervalMinutes: frequency,
        challengeTimer: timer,
        difficulty,
        locationMode,
        language,
        battleRoundEvery: 5,
        punishmentLevel: mode === 'chaos' ? 'heavy' : punishment
      }
      const code = await createSession({
        hostId,
        hostName: player.name || 'Host',
        hostCharacterId: player.characterId,
        sessionName: sessionName.trim()
      })
      // Settings sofort in Firestore schreiben — kein Race Condition via LobbyScreen
      await updateSessionSettings(code, settings)
      rememberLastSession(code)
      navigate(`/lobby/${code}`, {
        state: {
          initialSettings: settings  // LobbyScreen-Fallback, falls nötig
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
        <button className="create-game__back" onClick={() => navigate('/menu')}>‹</button>
        <h1 className="create-game__title">Neues Spiel</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="create-game__body">

        {/* Spielname */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <label className="create-game__label">Spielname</label>
          <input
            className="create-game__input"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value.slice(0, 32))}
            placeholder="Samstag Eskalation"
          />
        </motion.div>

        {/* Sprache */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <label className="create-game__label">Challenge-Sprache</label>
          <div className="create-game__lang-row">
            {LANGUAGE_OPTIONS.map((l) => (
              <button
                key={l.value}
                className={language === l.value
                  ? 'create-game__lang-btn create-game__lang-btn--active'
                  : 'create-game__lang-btn'}
                onClick={() => setLanguage(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Location-Modus */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <label className="create-game__label">Wo seid ihr unterwegs?</label>
          <div className="create-game__location-grid">
            {LOCATION_MODES.map((loc) => (
              <button
                key={loc.id}
                className={
                  locationMode === loc.id
                    ? 'create-game__location create-game__location--active'
                    : 'create-game__location'
                }
                onClick={() => setLocationMode(loc.id)}
              >
                <span className="create-game__location-icon">{loc.icon}</span>
                <span className="create-game__location-label">{loc.label}</span>
                <span className="create-game__location-desc">{loc.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Modus */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <label className="create-game__label">Modus</label>
          <div className="create-game__modes">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={mode === m.value ? 'create-game__mode create-game__mode--active' : 'create-game__mode'}
                onClick={() => setMode(m.value)}
              >
                <span className="create-game__mode-icon">{m.icon}</span>
                <span className="create-game__mode-label">{m.label}</span>
                <span className="create-game__mode-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Häufigkeit */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <label className="create-game__label">Wie oft kommt eine Challenge?</label>
          <div className="create-game__pill-row">
            {FREQUENCY_OPTIONS.map((f) => (
              <button
                key={f.value}
                className={frequency === f.value ? 'create-game__pill create-game__pill--active' : 'create-game__pill'}
                onClick={() => setFrequency(f.value)}
              >
                <span className="create-game__pill-main">{f.label}</span>
                <span className="create-game__pill-sub">{f.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Timer */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <label className="create-game__label">Zeit pro Challenge</label>
          <div className="create-game__difficulty">
            {TIMER_OPTIONS.map((t) => (
              <button
                key={t.value}
                className={timer === t.value ? 'create-game__diff-btn create-game__diff-btn--active' : 'create-game__diff-btn'}
                onClick={() => setTimer(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Schwierigkeit */}
        <motion.div className="create-game__field"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="create-game__label">Schwierigkeit</label>
          <div className="create-game__difficulty">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                className={difficulty === d.value ? 'create-game__diff-btn create-game__diff-btn--active' : 'create-game__diff-btn'}
                onClick={() => setDifficulty(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Strafe */}
        {mode !== 'casual' && (
          <motion.div className="create-game__field"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <label className="create-game__label">Strafe bei Ablehnung</label>
            <div className="create-game__modes">
              {PUNISHMENT_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  className={punishment === p.value ? 'create-game__mode create-game__mode--active' : 'create-game__mode'}
                  onClick={() => setPunishment(p.value)}
                >
                  <span className="create-game__mode-label">{p.label}</span>
                  <span className="create-game__mode-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

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
