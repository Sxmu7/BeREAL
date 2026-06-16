import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  subscribeToSession,
  joinSession,
  removePlayer,
  startSession,
  updateSessionSettings,
  generatePlayerId
} from '../lib/sessions'
import { getCharacterById } from '../lib/characters'
import QrCodeDisplay from '../components/QrCodeDisplay'
import './LobbyScreen.css'

function getOrCreatePlayerId() {
  let id = localStorage.getItem('daredrop_player_id')
  if (!id) {
    id = generatePlayerId()
    localStorage.setItem('daredrop_player_id', id)
  }
  return id
}

export default function LobbyScreen({ player }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const playerId = useRef(getOrCreatePlayerId()).current

  useEffect(() => {
    const unsubscribe = subscribeToSession(
      code,
      (data) => {
        setSession(data)

        if (data.status === 'active') {
          navigate(`/game/${code}`)
          return
        }

        // Falls Settings beim Erstellen mitgegeben wurden (vom Host-Setup),
        // einmalig anwenden.
        const initialSettings = location.state?.initialSettings
        if (initialSettings && data.hostId === playerId) {
          updateSessionSettings(code, initialSettings).catch(console.error)
          navigate(`/lobby/${code}`, { replace: true, state: {} })
        }

        // Wenn der eigene Spieler noch nicht in der Liste ist (z.B. Join-Flow),
        // einmal beitreten.
        const alreadyIn = data.players?.some((p) => p.id === playerId)
        if (!alreadyIn && !hasAttemptedJoin) {
          setHasAttemptedJoin(true)
          joinSession(code, {
            id: playerId,
            name: player.name || 'Spieler',
            characterId: player.characterId
          }).catch(console.error)
        }
      },
      () => setNotFound(true)
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  if (notFound) {
    return (
      <div className="lobby-screen lobby-screen--centered">
        <p className="lobby-screen__not-found">
          Diese Session existiert nicht mehr.
        </p>
        <button className="btn-secondary" onClick={() => navigate('/menu')}>
          Zurück zum Menü
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="lobby-screen lobby-screen--centered">
        <p className="lobby-screen__loading">Lädt Lobby…</p>
      </div>
    )
  }

  const isHost = session.hostId === playerId
  const players = session.players || []

  function handleStart() {
    startSession(code)
  }

  function handleRemove(p) {
    if (p.id === playerId) return
    removePlayer(code, p)
  }

  function handleCopyCode() {
    navigator.clipboard?.writeText(code).catch(() => {})
  }

  return (
    <div className="lobby-screen">
      <button className="lobby-screen__back" onClick={() => navigate('/menu')}>
        ← Verlassen
      </button>

      <div className="lobby-screen__header">
        <span className="eyebrow">{session.sessionName}</span>
        <button className="lobby-screen__code" onClick={handleCopyCode}>
          <span className="lobby-screen__code-value">{code}</span>
          <span className="lobby-screen__code-hint">Tippen zum Kopieren</span>
        </button>

        <button
          className="lobby-screen__qr-toggle"
          onClick={() => setShowQr((v) => !v)}
        >
          {showQr ? 'QR-Code ausblenden' : '📷 QR-Code zeigen'}
        </button>

        {showQr && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <QrCodeDisplay code={code} />
          </motion.div>
        )}
      </div>

      <div className="lobby-screen__circle">
        <div className="lobby-screen__ring">
          <AnimatePresence>
            {players.map((p, i) => {
              const angle = (360 / players.length) * i - 90
              const radius = 42
              const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
              const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
              const character = getCharacterById(p.characterId)
              return (
                <motion.div
                  key={p.id}
                  className="lobby-avatar"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <span className="lobby-avatar__icon">
                    {character?.icon || '🎮'}
                  </span>
                  <span className="lobby-avatar__name">
                    {p.name}
                    {p.isHost && <span className="lobby-avatar__host-tag">Host</span>}
                  </span>
                  {isHost && !p.isHost && (
                    <button
                      className="lobby-avatar__remove"
                      onClick={() => handleRemove(p)}
                      aria-label={`${p.name} entfernen`}
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div className="lobby-screen__center glass">
            <span className="lobby-screen__center-count">{players.length}</span>
            <span className="lobby-screen__center-label">
              {players.length === 1 ? 'Spieler' : 'Spieler'}
            </span>
          </div>
        </div>
      </div>

      <div className="lobby-screen__actions">
        {isHost ? (
          <button
            className="btn-primary"
            disabled={players.length < 2}
            onClick={handleStart}
          >
            {players.length < 2
              ? 'Warte auf mehr Spieler…'
              : `Session starten (${players.length})`}
          </button>
        ) : (
          <p className="lobby-screen__waiting">Warte, bis der Host startet…</p>
        )}
      </div>
    </div>
  )
}
