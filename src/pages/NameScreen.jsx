import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './NameScreen.css'

const MAX_LENGTH = 16

export default function NameScreen({ player, setName }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(player.name || '')
  const trimmed = value.trim()
  const isValid = trimmed.length >= 2

  function handleContinue() {
    if (!isValid) return
    setName(trimmed)
    navigate('/character')
  }

  return (
    <div className="name-screen">
      <button className="name-screen__back" onClick={() => navigate('/')}>
        ← Zurück
      </button>

      <div className="name-screen__content">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <span className="eyebrow">Schritt 1 von 2</span>
          <h1 className="name-screen__title">
            Wie sollen dich die anderen sehen?
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="name-screen__input-wrap glass"
        >
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Spielername"
            autoFocus
            maxLength={MAX_LENGTH}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleContinue()
            }}
          />
          <span className="name-screen__counter">
            {trimmed.length}/{MAX_LENGTH}
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        className="name-screen__actions"
      >
        <button
          className="btn-primary"
          disabled={!isValid}
          onClick={handleContinue}
        >
          Weiter
        </button>
      </motion.div>
    </div>
  )
}
