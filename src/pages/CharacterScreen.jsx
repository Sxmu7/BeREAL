import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CHARACTERS, getCharacterById } from '../lib/characters'
import ThemeToggle from '../components/ThemeToggle'
import './CharacterScreen.css'

export default function CharacterScreen({ player, setCharacter, theme, toggleTheme }) {
  const navigate = useNavigate()
  const selected = getCharacterById(player.characterId)

  function handleSelect(id) {
    setCharacter(id)
  }

  function handleContinue() {
    if (!selected) return
    navigate('/menu')
  }

  return (
    <div className="character-screen">
      <div className="character-screen__top-row">
        <button className="character-screen__back" onClick={() => navigate('/name')}>
          ← Zurück
        </button>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="character-screen__header">
        <span className="eyebrow">Schritt 2 von 2</span>
        <h1 className="character-screen__title">Wähle deinen Charakter</h1>
        <p className="character-screen__subtitle">
          Gilt nur für diese Session · {player.name || 'Spieler'}
        </p>
      </div>

      <div className="character-screen__grid">
        {CHARACTERS.map((c, i) => {
          const isSelected = c.id === player.characterId
          return (
            <motion.button
              key={c.id}
              className={
                isSelected
                  ? 'character-card character-card--selected'
                  : 'character-card'
              }
              onClick={() => handleSelect(c.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: 'easeOut' }}
              whileTap={{ scale: 0.94 }}
            >
              <span className="character-card__icon">{c.icon}</span>
              <span className="character-card__name">{c.name}</span>
            </motion.button>
          )
        })}
      </div>

      <div className="character-screen__actions">
        <button
          className="btn-primary"
          disabled={!selected}
          onClick={handleContinue}
        >
          {selected ? `Weiter als ${selected.icon} ${player.name}` : 'Charakter wählen'}
        </button>
      </div>
    </div>
  )
}
