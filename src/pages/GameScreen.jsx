import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToSession } from '../lib/sessions'
import {
  startNewRound,
  advanceRoundPhase,
  setRoundDecision,
  submitProof,
  castVote,
  tallyVotes,
  finalizeRound
} from '../lib/rounds'
import { getCharacterById } from '../lib/characters'
import { getPunishmentLabel } from '../lib/challenges'
import WheelSpin from '../components/WheelSpin'
import CircularTimer from '../components/CircularTimer'
import VideoProofRecorder from '../components/VideoProofRecorder'
import './GameScreen.css'

function getOwnPlayerId() {
  return localStorage.getItem('daredrop_player_id')
}

export default function GameScreen({ player }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const playerId = useRef(getOwnPlayerId()).current
  const [session, setSession] = useState(null)
  const hasFinalizedRef = useRef(false)

  useEffect(() => {
    const unsubscribe = subscribeToSession(
      code,
      (data) => setSession(data),
      () => navigate('/menu')
    )
    return unsubscribe
  }, [code, navigate])

  // Host startet die erste Runde, sobald die Session aktiv ist und
  // noch keine Runde läuft.
  useEffect(() => {
    if (!session) return
    const isHost = session.hostId === playerId
    if (isHost && session.status === 'active' && !session.currentRound) {
      startNewRound(code, {
        players: session.players,
        difficulty: session.settings.difficulty,
        roundNumber: 1
      }).catch(console.error)
    }
  }, [session, code, playerId])

  if (!session || !session.currentRound) {
    return (
      <div className="game-screen game-screen--centered">
        <p className="game-screen__loading">Runde wird vorbereitet…</p>
      </div>
    )
  }

  const round = session.currentRound
  const isSelected = round.selectedPlayerId === playerId
  const isHost = session.hostId === playerId
  const selectedPlayer = session.players.find((p) => p.id === round.selectedPlayerId)
  const eligibleVoters = session.players.filter((p) => p.id !== round.selectedPlayerId)
  const hasVoted = !!round.votes?.[playerId]

  function handleSpinComplete() {
    if (isHost) {
      // Host treibt den Phasenwechsel an, alle anderen folgen über den Listener.
      setTimeout(() => {
        advanceRoundPhase(code, 'challenge').catch(console.error)
      }, 1400)
    }
  }

  async function handleDecision(decision) {
    if (!isSelected) return
    await setRoundDecision(code, decision)
  }

  async function handleProofUploaded(url) {
    await submitProof(code, url)
  }

  async function handleVote(vote) {
    if (isSelected || hasVoted) return
    const updatedVotes = await castVote(code, round.votes || {}, playerId, vote)

    // Wer auch immer gerade abstimmt, prüft, ob jetzt alle abgestimmt
    // haben, und löst dann (einmalig) die Auswertung aus. Das ist
    // robuster als "nur der Host darf das", falls der Host selbst
    // mitstimmt und zuletzt dran ist.
    const outcome = tallyVotes(
      updatedVotes,
      eligibleVoters.map((p) => p.id)
    )
    if (outcome && !hasFinalizedRef.current) {
      hasFinalizedRef.current = true
      await finalizeRound(code, {
        outcome,
        players: session.players,
        stats: session.stats || {},
        selectedPlayerId: round.selectedPlayerId
      })
    }
  }

  async function handleNextRound() {
    if (!isHost) return
    hasFinalizedRef.current = false
    await startNewRound(code, {
      players: session.players,
      difficulty: session.settings.difficulty,
      roundNumber: (round.roundNumber || 1) + 1
    })
  }

  const punishmentLabel =
    session.settings.gameMode === 'casual'
      ? getPunishmentLabel({
          gameMode: 'casual',
          punishmentLevel: session.settings.punishmentLevel
        })
      : getPunishmentLabel({
          gameMode: 'party',
          drink: selectedPlayer?.drink || 'soft',
          punishmentLevel: session.settings.punishmentLevel
        })

  return (
    <div className="game-screen">
      <div className="game-screen__header">
        <span className="eyebrow">Runde {round.roundNumber}</span>
        {round.phase === 'challenge' && (
          <CircularTimer
            totalSeconds={session.settings.challengeTimer}
            size={56}
            onComplete={() => {
              if (isSelected) handleDecision('punishment')
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {round.phase === 'spinning' && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="game-screen__phase game-screen__phase--centered"
          >
            <WheelSpin
              players={session.players}
              selectedPlayerId={round.selectedPlayerId}
              onSpinComplete={handleSpinComplete}
            />
          </motion.div>
        )}

        {round.phase === 'challenge' && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="game-screen__phase"
          >
            <div className="game-screen__challenge-card glass">
              <span className="eyebrow">
                {getCharacterById(selectedPlayer?.characterId)?.icon} {selectedPlayer?.name}{' '}
                ist dran
              </span>
              <p className="game-screen__challenge-text">{round.challengeText}</p>
              <p className="game-screen__punishment-hint">
                Bei Ablehnung: {punishmentLabel}
              </p>
            </div>

            {isSelected ? (
              <div className="game-screen__decision-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleDecision('punishment')}
                >
                  Strafe nehmen
                </button>
                <button className="btn-primary" onClick={() => handleDecision('accepted')}>
                  Annehmen
                </button>
              </div>
            ) : (
              <p className="game-screen__waiting-text">
                Warte auf {selectedPlayer?.name}…
              </p>
            )}
          </motion.div>
        )}

        {round.phase === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="game-screen__phase"
          >
            {isSelected ? (
              <VideoProofRecorder
                sessionCode={code}
                roundNumber={round.roundNumber}
                playerId={playerId}
                onUploaded={handleProofUploaded}
              />
            ) : (
              <div className="game-screen__spectator">
                <span className="game-screen__spectator-icon">🎥</span>
                <p className="game-screen__spectator-text">
                  {selectedPlayer?.name} nimmt die Challenge auf…
                </p>
              </div>
            )}
          </motion.div>
        )}

        {round.phase === 'voting' && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="game-screen__phase"
          >
            {round.proofUrl && (
              <video
                className="game-screen__proof-video"
                src={round.proofUrl}
                controls
                playsInline
              />
            )}

            {isSelected ? (
              <p className="game-screen__waiting-text">
                Die anderen stimmen ab, ob du es geschafft hast…
              </p>
            ) : hasVoted ? (
              <p className="game-screen__waiting-text">
                Stimme abgegeben. Warte auf die anderen…
              </p>
            ) : (
              <>
                <p className="game-screen__vote-question">Challenge geschafft?</p>
                <div className="game-screen__vote-actions">
                  <button className="btn-secondary" onClick={() => handleVote('no')}>
                    Nein
                  </button>
                  <button className="btn-primary" onClick={() => handleVote('yes')}>
                    Ja
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {round.phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="game-screen__phase game-screen__phase--centered"
          >
            <div className="game-screen__result-card glass">
              <span className="game-screen__result-icon">
                {round.outcome === 'success' ? '🏆' : '🍺'}
              </span>
              <p className="game-screen__result-title">
                {round.outcome === 'success'
                  ? `${selectedPlayer?.name} hat's geschafft!`
                  : round.outcome === 'punished'
                  ? `${selectedPlayer?.name} nimmt die Strafe.`
                  : `${selectedPlayer?.name} hat's nicht geschafft.`}
              </p>
              {round.outcome !== 'success' && (
                <p className="game-screen__punishment-hint">{punishmentLabel}</p>
              )}
            </div>

            {isHost && (
              <button className="btn-primary" onClick={handleNextRound}>
                Nächste Runde
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
