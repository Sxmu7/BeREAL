import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  subscribeToSession, joinSession, removePlayer,
  startSession, updateSessionSettings, generatePlayerId
} from '../lib/sessions'
import { getCharacterById } from '../lib/characters'
import QrCodeDisplay from '../components/QrCodeDisplay'
import './LobbyScreen.css'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
]

function getOrCreatePlayerId() {
  let id = localStorage.getItem('daredrop_player_id')
  if (!id) { id = generatePlayerId(); localStorage.setItem('daredrop_player_id', id) }
  return id
}

export default function LobbyScreen({ player, theme, toggleTheme }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState(false)
  const playerId = useRef(getOrCreatePlayerId()).current

  useEffect(() => {
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'active') { navigate(`/game/${code}`); return }
      const initialSettings = location.state?.initialSettings
      if (initialSettings && data.hostId === playerId) {
        updateSessionSettings(code, initialSettings).catch(console.error)
        navigate(`/lobby/${code}`, { replace: true, state: {} })
      }
      const alreadyIn = data.players?.some((p) => p.id === playerId)
      if (!alreadyIn && !hasJoined) {
        setHasJoined(true)
        joinSession(code, { id: playerId, name: player.name || 'Spieler', characterId: player.characterId }).catch(console.error)
      }
    }, () => setNotFound(true))
    return unsub
  }, [code])  // eslint-disable-line

  function handleCopyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  if (notFound) return (
    <div className="lobby lobby--centered">
      <p className="lobby__not-found">Session existiert nicht mehr.</p>
      <button className="btn-secondary" onClick={() => navigate('/menu')}>Zurück</button>
    </div>
  )

  if (!session) return (
    <div className="lobby lobby--centered">
      <div className="lobby__spinner" />
    </div>
  )

  const isHost = session.hostId === playerId
  const players = session.players || []

  return (
    <div className="lobby">
      {/* Header */}
      <div className="lobby__header">
        <button className="lobby__back" onClick={() => navigate('/menu')}>‹</button>
        <div className="lobby__header-center">
          <h1 className="lobby__title">{session.sessionName}</h1>
          <span className="eyebrow">Lobby</span>
        </div>
        <button className="lobby__menu-btn" onClick={() => setShowQr(v => !v)}>···</button>
      </div>

      {/* Code als einzelne Boxen */}
      <div className="lobby__code-section">
        <p className="lobby__code-label eyebrow">Spielcode</p>
        <div className="code-digits">
          {code.split('').map((char, i) => (
            <motion.div
              key={i}
              className="code-digit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {char}
            </motion.div>
          ))}
        </div>
        <button className="lobby__copy-btn" onClick={handleCopyCode}>
          {copied ? '✓ Kopiert!' : 'Teile den Code mit deinen Freunden'}
        </button>
      </div>

      {/* QR */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lobby__qr"
          >
            <QrCodeDisplay code={code} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spielerliste */}
      <div className="lobby__players">
        <p className="lobby__players-label">Spieler</p>
        <div className="lobby__player-list">
          <AnimatePresence>
            {players.map((p, i) => {
              const character = getCharacterById(p.characterId)
              const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
              return (
                <motion.div
                  key={p.id}
                  className="lobby__player"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <div className="lobby__player-avatar" style={{ background: grad }}>
                    {character?.icon || '🎮'}
                  </div>
                  <div className="lobby__player-info">
                    <span className="lobby__player-name">
                      {p.name}
                      {p.isHost && <span className="lobby__host-crown"> 👑</span>}
                    </span>
                  </div>
                  <span className="lobby__player-online" />
                  {isHost && !p.isHost && (
                    <button className="lobby__remove-btn" onClick={() => removePlayer(code, p)}>×</button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Warte-Platzhalter */}
          <div className="lobby__player lobby__player--ghost">
            <div className="lobby__player-avatar lobby__player-avatar--ghost">+</div>
            <span className="lobby__player-name lobby__player-name--ghost">Wartet auf Spieler …</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="lobby__footer">
        {isHost ? (
          <button
            className="btn-primary"
            disabled={players.length < 2}
            onClick={() => startSession(code)}
          >
            {players.length < 2 ? 'Warte auf Spieler…' : 'Spiel starten'}
          </button>
        ) : (
          <div className="lobby__waiting-host">
            <div className="lobby__waiting-dot" />
            <p className="lobby__waiting-text">Warte auf den Host…</p>
          </div>
        )}
      </div>
    </div>
  )
}
