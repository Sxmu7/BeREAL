import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToSession, endSession } from '../lib/sessions'
import {
  startNewRound,
  advanceRoundPhase,
  advanceToSpinning,
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
import RoundCountdown from '../components/RoundCountdown'
import LiveRanking from '../components/LiveRanking'
import PartyEventBanner from '../components/PartyEventBanner'
import Confetti from '../components/Confetti'
import { clearLastSession } from '../lib/lastSession'
import { playSuccessSound, playFailSound, playCardSound, vibrate } from '../lib/sounds'
import './GameScreen.css'

const VOTING_SECONDS = 30

const LOCATION_META = {
  bar:        { emoji: '🍺', label: 'Bar' },
  festival:   { emoji: '🎪', label: 'Festival' },
  hostel:     { emoji: '🏠', label: 'Hostel' },
  houseparty: { emoji: '🎉', label: 'Hausparty' },
  vacation:   { emoji: '🌴', label: 'Urlaub' },
}

const DIFF_LEVELS = { easy: 1, medium: 2, hard: 3, chaos: 4 }

function getOwnPlayerId() {
  return localStorage.getItem('daredrop_player_id')
}

export default function GameScreen({ player }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const playerId = useRef(getOwnPlayerId()).current
  const [session, setSession] = useState(null)
  const hasFinalizedRef = useRef(false)
  const lastSoundedRoundRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeToSession(
      code,
      (data) => setSession(data),
      () => navigate('/menu')
    )
    return unsubscribe
  }, [code, navigate])

  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'result' || !round.outcome) return
    const soundKey = `${round.roundNumber}-${round.outcome}`
    if (lastSoundedRoundRef.current === soundKey) return
    lastSoundedRoundRef.current = soundKey

    if (round.outcome === 'success') {
      playSuccessSound()
      vibrate([60, 40, 60])
    } else {
      playFailSound()
      vibrate(150)
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    const isHost = session.hostId === playerId
    if (isHost && session.status === 'active' && !session.currentRound) {
      startNewRound(code, {
        players: session.players,
        difficulty: session.settings.difficulty,
        locationMode: session.settings.locationMode,
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

  const locationMode = session.settings.locationMode
  const locationMeta = LOCATION_META[locationMode] || { emoji: '🎮', label: locationMode }
  const difficultyLevel = DIFF_LEVELS[session.settings.difficulty] || 2

  function handleSpinComplete() {
    if (isHost) {
      setTimeout(() => {
        advanceRoundPhase(code, 'challenge').catch(console.error)
      }, 1400)
    }
  }

  function handleCountdownDone() {
    if (isHost) {
      advanceToSpinning(code).catch(console.error)
    }
  }

  async function handleDecision(decision) {
    if (!isSelected) return
    playCardSound()
    vibrate(40)
    await setRoundDecision(code, decision)
  }

  async function handleProofUploaded(url) {
    await submitProof(code, url)
  }

  async function handleVote(vote) {
    if (isSelected || hasVoted) return
    playCardSound()
    vibrate(40)
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
        selectedPlayerId: round.selectedPlayerId,
        pointsMultiplier: round.partyEvent?.effect === 'double_points' ? 2 : 1
      }).catch(console.error)
    }
  }

  function handleVotingTimeout() {
    checkAndFinalize(round.votes || {}, true)
  }

  async function handleAllDrinkContinue() {
    if (!isHost) return
    await advanceRoundPhase(code, 'result')
  }

  async function handleNextRound() {
    if (!isHost) return
    hasFinalizedRef.current = false
    await startNewRound(code, {
      players: session.players,
      difficulty: session.settings.difficulty,
      locationMode: session.settings.locationMode,
      roundNumber: (round.roundNumber || 1) + 1,
      previousSelectedPlayerId: round.selectedPlayerId
    })
  }

  async function handleEndGame() {
    if (isHost) {
      await endSession(code).catch(console.error)
    }
    clearLastSession()
    navigate(`/recap/${code}`, {
      state: {
        sessionSnapshot: {
          sessionName: session.sessionName,
          players: session.players,
          stats: session.stats || {},
          roundNumber: round.roundNumber || 1,
          createdAtMs: session.createdAt?.toMillis?.() || null
        },
        ownPlayerId: playerId
      }
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
        <button
          className="game-screen__back-btn"
          onClick={() => navigate('/menu')}
          aria-label="Verlassen"
        >
          ‹
        </button>

        {/* Round badge — pulsing dot + label */}
        <div className="game-screen__round-badge">
          <div className="game-screen__round-dot" />
          <span className="game-screen__round-label">Runde {round.roundNumber}</span>
        </div>

        <div className="game-screen__header-actions">
          {round.phase !== 'countdown' && round.phase !== 'result' && (
            <LiveRanking players={session.players} stats={session.stats} />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {round.phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="game-screen__phase game-screen__phase--centered"
          >
            <RoundCountdown players={session.players} onDone={handleCountdownDone} />
          </motion.div>
        )}

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
            <PartyEventBanner event={round.partyEvent} />

            {round.partyEvent?.effect === 'all_drink' ? (
              isHost && (
                <button className="btn-primary" onClick={handleAllDrinkContinue}>
                  Weiter zur nächsten Runde
                </button>
              )
            ) : (
              <>
                {/* Player avatar */}
                <div className="game-screen__challenge-header">
                  <div className="game-screen__challenge-avatar">
                    {getCharacterById(selectedPlayer?.characterId)?.icon || '🎮'}
                  </div>
                  <span className="game-screen__challenge-player-name">
                    {selectedPlayer?.name}
                  </span>
                  <div className="game-screen__challenge-progress" />
                </div>

                {/* Styled challenge card */}
                <div className="game-screen__challenge-card">
                  <div className="game-screen__challenge-glow" />

                  <div className="game-screen__challenge-location-badge">
                    <span>{locationMeta.emoji}</span>
                    <span>{locationMeta.label}</span>
                  </div>

                  <p className="game-screen__challenge-text">{round.challengeText}</p>

                  <div className="game-screen__challenge-footer">
                    <div className="game-screen__challenge-difficulty">
                      <span className="game-screen__challenge-diff-label">Level</span>
                      <div className="game-screen__challenge-dots">
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className={`game-screen__challenge-dot ${n <= difficultyLevel ? 'game-screen__challenge-dot--active' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="game-screen__punishment-hint">
                      ⚡ {punishmentLabel}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="game-screen__decision-actions">
                    <button
                      className="game-screen__btn-refuse"
                      onClick={() => handleDecision('punishment')}
                    >
                      ✕ Nein
                    </button>
                    <button
                      className="game-screen__btn-accept"
                      onClick={() => handleDecision('accepted')}
                    >
                      ✓ Annehmen
                    </button>
                  </div>
                ) : (
                  <p className="game-screen__waiting-text">
                    Warte auf {selectedPlayer?.name}…
                  </p>
                )}
              </>
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
                    className="game-screen__vote-no"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleVote('no')}
                  >
                    ✕ Nein
                  </motion.button>
                  <motion.button
                    className="game-screen__vote-yes"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleVote('yes')}
                  >
                    ✓ Ja
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
            {round.outcome === 'success' && <Confetti />}

            <motion.div
              className="game-screen__result-hero"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
            >
              <div
                className={`game-screen__result-circle ${
                  round.outcome === 'success'
                    ? 'game-screen__result-circle--success'
                    : 'game-screen__result-circle--fail'
                }`}
              >
                {round.partyEvent?.effect === 'all_drink'
                  ? '🍻'
                  : round.outcome === 'success'
                  ? '✓'
                  : '✕'}
              </div>
            </motion.div>

            <motion.div
              className="game-screen__result-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="game-screen__result-title">
                {round.partyEvent?.effect === 'all_drink'
                  ? 'Alle haben getrunken! 🍻'
                  : round.outcome === 'success'
                  ? `${selectedPlayer?.name} hat geschafft! 🎉`
                  : round.outcome === 'punished'
                  ? `${selectedPlayer?.name} nimmt die Strafe.`
                  : `${selectedPlayer?.name} hat's nicht geschafft.`}
              </p>
              {round.outcome === 'success' && (
                <p className="game-screen__result-points">+50 Punkte</p>
              )}
              {round.outcome !== 'success' && round.partyEvent?.effect !== 'all_drink' && (
                <p className="game-screen__punishment-hint">{punishmentLabel}</p>
              )}
            </motion.div>

            {/* Scoreboard with medal ranks */}
            <motion.div
              className="game-screen__scoreboard"
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
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                    return (
                      <motion.div
                        key={p.id}
                        className={`game-screen__scoreboard-row ${i === 0 ? 'game-screen__scoreboard-row--first' : ''}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.25 }}
                      >
                        <span className="game-screen__scoreboard-rank">
                          {medal || i + 1}
                        </span>
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
              <div className="game-screen__result-actions">
                <button className="btn-primary" onClick={handleNextRound}>
                  Nächste Runde
                </button>
                <button className="game-screen__end-game" onClick={handleEndGame}>
                  Spiel beenden
                </button>
              </div>
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
