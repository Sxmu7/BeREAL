import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCharacterById } from '../lib/characters'
import FloatingDots from '../components/FloatingDots'
import ThemeToggle from '../components/ThemeToggle'
import './MainMenu.css'

const PRIMARY_ITEMS = [
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
  }
]

const SECONDARY_ITEMS = [
  {
    key: 'rules',
    title: 'Spielregeln',
    icon: '📖',
    path: '/rules'
  },
  {
    key: 'profile',
    title: 'Statistiken',
    icon: '🏆',
    path: '/profile'
  }
]

export default function MainMenu({ player, theme, toggleTheme }) {
  const navigate = useNavigate()
  const character = getCharacterById(player.characterId)

  return (
    <div className="main-menu">
      <FloatingDots count={6} />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="main-menu__header"
      >
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
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
        {PRIMARY_ITEMS.map((item, i) => (
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

      <div className="main-menu__secondary">
        {SECONDARY_ITEMS.map((item, i) => (
          <motion.button
            key={item.key}
            className="menu-secondary-item"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 + i * 0.06, ease: 'easeOut' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(item.path)}
          >
            <span className="menu-secondary-item__icon">{item.icon}</span>
            <span className="menu-secondary-item__title">{item.title}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
