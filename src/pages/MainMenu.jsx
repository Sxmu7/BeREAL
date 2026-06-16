import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCharacterById } from '../lib/characters'
import './MainMenu.css'

const MENU_ITEMS = [
  {
    key: 'host',
    title: 'Host Game',
    subtitle: 'Session erstellen & Regeln festlegen',
    icon: '🎛️',
    path: '/host'
  },
  {
    key: 'join',
    title: 'Join Game',
    subtitle: 'Mit Lobby-Code beitreten',
    icon: '🔗',
    path: '/join'
  },
  {
    key: 'rules',
    title: 'Rules',
    subtitle: 'So funktioniert DareDrop',
    icon: '📜',
    path: '/rules'
  }
]

export default function MainMenu({ player }) {
  const navigate = useNavigate()
  const character = getCharacterById(player.characterId)

  return (
    <div className="main-menu">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="main-menu__header"
      >
        <div className="main-menu__player glass">
          <span className="main-menu__player-icon">
            {character?.icon || '🎮'}
          </span>
          <div>
            <p className="main-menu__player-name">{player.name || 'Spieler'}</p>
            <p className="main-menu__player-char">
              {character?.name || 'Kein Charakter'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="main-menu__title-wrap">
        <h1 className="main-menu__title">DareDrop</h1>
      </div>

      <div className="main-menu__cards">
        {MENU_ITEMS.map((item, i) => (
          <motion.button
            key={item.key}
            className="menu-card glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
          >
            <span className="menu-card__icon">{item.icon}</span>
            <span className="menu-card__text">
              <span className="menu-card__title">{item.title}</span>
              <span className="menu-card__subtitle">{item.subtitle}</span>
            </span>
            <span className="menu-card__arrow">→</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
