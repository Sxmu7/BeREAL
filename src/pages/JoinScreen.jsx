import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import QrScanner from '../components/QrScanner'
import ThemeToggle from '../components/ThemeToggle'
import './JoinScreen.css'

export default function JoinScreen({ theme, toggleTheme }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState(null)
  const [showScanner, setShowScanner] = useState(false)

  async function handleJoin(scannedCode) {
    const trimmed = (scannedCode ?? code).trim().toUpperCase()
    if (trimmed.length < 4) return

    setError(null)
    setIsChecking(true)
    try {
      const snap = await getDoc(doc(db, 'sessions', trimmed))
      if (!snap.exists()) {
        setError('Diesen Code gibt es nicht. Prüfe die Eingabe.')
        setIsChecking(false)
        return
      }
      if (snap.data().status !== 'lobby') {
        setError('Diese Session läuft schon oder ist beendet.')
        setIsChecking(false)
        return
      }
      navigate(`/lobby/${trimmed}`)
    } catch (err) {
      console.error(err)
      setError('Verbindung fehlgeschlagen. Prüfe die Firebase-Einrichtung.')
      setIsChecking(false)
    }
  }

  function handleScanned(scannedCode) {
    setShowScanner(false)
    setCode(scannedCode)
    handleJoin(scannedCode)
  }

  return (
    <div className="join-screen">
      <div className="join-screen__top-row">
        <button className="join-screen__back" onClick={() => navigate('/menu')}>
          ← Zurück
        </button>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="join-screen__content">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="eyebrow">Join Game</span>
          <h1 className="join-screen__title">Lobby-Code eingeben</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="join-screen__input-wrap glass"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setError(null)
              setCode(e.target.value.toUpperCase().slice(0, 5))
            }}
            placeholder="ABCDE"
            autoFocus
            autoCapitalize="characters"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin()
            }}
          />
        </motion.div>

        {error && <p className="join-screen__error">{error}</p>}

        <button className="join-screen__qr-hint" onClick={() => setShowScanner(true)}>
          📷 QR-Code scannen
        </button>
      </div>

      <div className="join-screen__actions">
        <button
          className="btn-primary"
          disabled={code.trim().length < 4 || isChecking}
          onClick={() => handleJoin()}
        >
          {isChecking ? 'Suche Session…' : 'Beitreten'}
        </button>
      </div>

      {showScanner && (
        <QrScanner onScanned={handleScanned} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
