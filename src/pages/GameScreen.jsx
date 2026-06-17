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
  finalizeRound,
  ensurePlayerStats
} from '../lib/rounds'
import { getCharacterById } from '../lib/characters'
import { getPunishmentLabel } from '../lib/challenges'
import WheelSpin from '../components/WheelSpin'
import FullscreenTimer from '../components/FullscreenTimer'
import VideoProofRecorder from '../components/VideoProofRecorder'
import './GameScreen.css'

const VOTING_SECONDS = 30

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
    checkAndFinalize(updatedVotes, false)
  }

  function checkAndFinalize(votes, force) {
    const outcome = tallyVotes(
      votes,
      eligibleVoters.map((p) => p.id),
      force
    )
    if (outcome && !hasFinalizedRef.current) {
      hasFinalizedRef.current = true
      finalizeRound(code, {
        outcome,
        players: session.players,
        stats: session.stats || {},
        selectedPlayerId: round.selectedPlayerId
      }).catch(console.error)
    }
  }

  function handleVotingTimeout() {
    // Wer auch immer als erstes den Timer ablaufen sieht, erzwingt die
    // Auswertung mit den bisher abgegebenen Stimmen. hasFinalizedRef
    // verhindert, dass mehrere Geräte das doppelt auslösen.
    checkAndFinalize(round.votes || {}, true)
  }

  async function handleNextRound() {
    if (!isHost) return
    hasFinalizedRef.current = false
    await startNewRound(code, {
      players: session.players,
      difficulty: session.settings.difficulty,
      roundNumber: (round.roundNumber || 1) + 1,
      previousSelectedPlayerId: round.selectedPlayerId
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
              <VideoProofRecorder onUploaded={handleProofUploaded} />
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

            <div className="game-screen__vote-progress">
              <span className="eyebrow">
                {Object.keys(round.votes || {}).length} von {eligibleVoters.length} haben
                abgestimmt
              </span>
              <div className="game-screen__vote-progress-bar">
                <motion.div
                  className="game-screen__vote-progress-fill"
                  animate={{
                    width: `${
                      eligibleVoters.length > 0
                        ? (Object.keys(round.votes || {}).length / eligibleVoters.length) * 100
                        : 0
                    }%`
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {isSelected ? (
              <p className="game-screen__waiting-text">
                Die anderen stimmen ab, ob du es geschafft hast…
              </p>
            ) : hasVoted ? (
              <motion.p
                className="game-screen__waiting-text"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Stimme abgegeben. Warte auf die anderen…
              </motion.p>
            ) : (
              <>
                <p className="game-screen__vote-question">Challenge geschafft?</p>
                <div className="game-screen__vote-actions">
                  <motion.button
                    className="btn-secondary"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleVote('no')}
                  >
                    Nein
                  </motion.button>
                  <motion.button
                    className="btn-primary"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleVote('yes')}
                  >
                    Ja
                  </motion.button>
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
            <motion.div
              className="game-screen__result-card glass"
              initial={{ y: 12 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span
                className="game-screen__result-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 16 }}
              >
                {round.outcome === 'success' ? '🏆' : '🍺'}
              </motion.span>
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
            </motion.div>

            <motion.div
              className="game-screen__scoreboard glass"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <span className="eyebrow">Punktestand</span>
              <div className="game-screen__scoreboard-list">
                {[...session.players]
                  .sort(
                    (a, b) =>
                      ensurePlayerStats(session.stats, b.id).wins -
                      ensurePlayerStats(session.stats, a.id).wins
                  )
                  .map((p, i) => {
                    const s = ensurePlayerStats(session.stats, p.id)
                    const character = getCharacterById(p.characterId)
                    return (
                      <motion.div
                        key={p.id}
                        className="game-screen__scoreboard-row"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.25 }}
                      >
                        <span className="game-screen__scoreboard-rank">{i + 1}</span>
                        <span className="game-screen__scoreboard-icon">
                          {character?.icon || '🎮'}
                        </span>
                        <span className="game-screen__scoreboard-name">{p.name}</span>
                        <span className="game-screen__scoreboard-score">{s.wins} 🏆</span>
                      </motion.div>
                    )
                  })}
              </div>
            </motion.div>

            {isHost && (
              <button className="btn-primary" onClick={handleNextRound}>
                Nächste Runde
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {round.phase === 'challenge' && (
        <FullscreenTimer
          totalSeconds={session.settings.challengeTimer}
          label={isSelected ? 'Deine Entscheidungszeit' : `${selectedPlayer?.name} entscheidet`}
          onComplete={() => {
            if (isSelected) handleDecision('punishment')
          }}
        />
      )}

      {round.phase === 'voting' && (
        <FullscreenTimer
          totalSeconds={VOTING_SECONDS}
          label="Zeit zum Abstimmen"
          onComplete={handleVotingTimeout}
        />
      )}
    </div>
  )
}
