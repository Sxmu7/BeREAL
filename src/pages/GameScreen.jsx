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
import PhotoProofRecorder from '../components/PhotoProofRecorder'
import AudioProofRecorder from '../components/AudioProofRecorder'
import RoundCountdown from '../components/RoundCountdown'
import LiveRanking from '../components/LiveRanking'
import PartyEventBanner from '../components/PartyEventBanner'
import Confetti from '../components/Confetti'
import { clearLastSession } from '../lib/lastSession'
import { playSuccessSound, playFailSound, playCardSound, vibrate } from '../lib/sounds'
import { sendPushToPlayer } from '../lib/notifications'
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

// Quick spectator mini-dares shown while selected player decides
const SPECTATOR_DARES = [
  'Wer kann am längsten die Luft anhalten?',
  'Zeig deinen besten Schrei ohne Ton.',
  'Mach deinen besten Dance Move – 3 Sekunden.',
  'Stell die Person rechts von dir nach.',
  'Wer findet zuerst etwas Blaues auf sich?',
  'Mach deinen besten Filmzitat-Moment.',
  'Wer kann am lautesten "RIOT!" schreien?',
  'Mach eine Augenkontakt-Challenge mit deinem Nachbarn.',
  'Wer kann am schnellsten auf einem Bein stehen?',
  'Flüstere der Person neben dir ein Kompliment.',
]

function getRandomSpectatorDare() {
  return SPECTATOR_DARES[Math.floor(Math.random() * SPECTATOR_DARES.length)]
}

function getOwnPlayerId() {
  return localStorage.getItem('daredrop_player_id')
}

function getSipMultiplier(punishmentLevel) {
  if (punishmentLevel === 'mild') return 1
  if (punishmentLevel === 'medium') return 2
  if (punishmentLevel === 'heavy') return 3
  return 1
}

export default function GameScreen({ player }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const playerId = useRef(getOwnPlayerId()).current
  const [session, setSession] = useState(null)
  const hasFinalizedRef = useRef(false)
  const lastSoundedRoundRef = useRef(null)
  const lastNotifiedRoundRef = useRef(null)
  const autoStartedRef = useRef(false)
  const [sipCount, setSipCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const lastResultRef = useRef(null)
  const [spectatorDare, setSpectatorDare] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToSession(
      code,
      (data) => setSession(data),
      () => navigate('/menu')
    )
    return unsubscribe
  }, [code, navigate])

  // Sound + vibration on result
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

  // Track sip count and streak
  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'result' || !round.outcome) return
    const resultKey = `${round.roundNumber}-${round.outcome}`
    if (lastResultRef.current === resultKey) return
    lastResultRef.current = resultKey

    if (round.outcome === 'success') {
      setStreak((s) => s + 1)
    } else if (round.outcome === 'punished' || round.outcome === 'failed') {
      setStreak(0)
      const sips = getSipMultiplier(session.settings?.punishmentLevel)
      setSipCount((c) => c + sips)
    }
  }, [session])

  // Push-Benachrichtigung: 30s nach Challenge-Start senden (Reminder, nicht sofort)
  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'challenge') return
    if (session.hostId !== playerId) return
    if (lastNotifiedRoundRef.current === round.roundNumber) return

    const target = session.players?.find((p) => p.id === round.selectedPlayerId)
    if (!target?.fcmToken || target.id === playerId) return

    const lang = session.settings?.language || 'de'
    const title = lang === 'en' ? "⚡ It's your turn!" : '⚡ Du bist dran!'
    const body = (round.challengeText || '').slice(0, 100)

    // 30 Sekunden warten — falls Spieler schon schaut, braucht er keine Notification
    const timer = setTimeout(() => {
      if (lastNotifiedRoundRef.current === round.roundNumber) return
      lastNotifiedRoundRef.current = round.roundNumber
      sendPushToPlayer(target.fcmToken, title, body)
    }, 30_000)

    return () => clearTimeout(timer)
  }, [session?.currentRound?.roundNumber, session?.currentRound?.phase]) // eslint-disable-line

  // Generate spectator dare when challenge phase starts
  useEffect(() => {
    if (!session?.currentRound) return
    if (session.currentRound.phase === 'challenge') {
      setSpectatorDare(getRandomSpectatorDare())
    }
  }, [session?.currentRound?.phase])

  // Warteraum-Countdown: tickt von nextRoundAt bis 0 (timed-Modus)
  useEffect(() => {
    if (!session?.nextRoundAt || session?.currentRound?.phase !== 'result') {
      setCountdown(null)
      return
    }
    autoStartedRef.current = false

    const tick = () => {
      const target = session.nextRoundAt
      const targetMs =
        typeof target?.toMillis === 'function'
          ? target.toMillis()
          : target instanceof Date
          ? target.getTime()
          : 0
      const remaining = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000))
      setCountdown(remaining)
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [session?.nextRoundAt, session?.currentRound?.phase]) // eslint-disable-line

  // Automatischer Rundenstart wenn Countdown auf 0 (nur Host)
  useEffect(() => {
    if (countdown !== 0 || autoStartedRef.current) return
    if (!session || session.hostId !== playerId) return
    autoStartedRef.current = true
    hasFinalizedRef.current = false
    startNewRound(code, {
      players: session.players,
      difficulty: session.settings.difficulty,
      locationMode: session.settings.locationMode,
      language: session.settings.language || 'de',
      roundNumber: (session.currentRound?.roundNumber || 1) + 1,
      previousSelectedPlayerId: session.currentRound?.selectedPlayerId
    }).catch(console.error)
  }, [countdown]) // eslint-disable-line

  // Host starts first round
  useEffect(() => {
    if (!session) return
    const isHost = session.hostId === playerId
    if (isHost && session.status === 'active' && !session.currentRound) {
      startNewRound(code, {
        players: session.players,
        difficulty: session.settings.difficulty,
        locationMode: session.settings.locationMode,
        language: session.settings.language || 'de',
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
  const locationMeta = LOCATION_META[locationMode] || { emoji: '⚡', label: locationMode }
  const difficultyLevel = DIFF_LEVELS[session.settings.difficulty] || 2

  function handleSpinComplete() {
    if (isHost) {
      setTimeout(() => {
        advanceRoundPhase(code, 'challenge').catch(console.error)
      }, 1400)
    }
  }

  function handleCountdownDone() {
    if (isHost) advanceToSpinning(code).catch(console.error)
  }

  async function handleDecision(decision) {
    if (!isSelected) return
    playCardSound()
    vibrate(40)
    // proofType übergeben → 'none'-Challenges springen direkt zur Abstimmung
    await setRoundDecision(code, decision, round.proofType || 'photo')
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
    const outcome = tallyVotes(votes, eligibleVoters.map((p) => p.id), force)
    if (outcome && !hasFinalizedRef.current) {
      hasFinalizedRef.current = true
      const delayMs = session.settings?.roundMode === 'timed'
        ? (session.settings?.challengeIntervalMinutes || 5) * 60 * 1000
        : null
      finalizeRound(code, {
        outcome,
        players: session.players,
        stats: session.stats || {},
        selectedPlayerId: round.selectedPlayerId,
        pointsMultiplier: round.partyEvent?.effect === 'double_points' ? 2 : 1,
        nextRoundDelayMs: delayMs
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
      language: session.settings.language || 'de',
      roundNumber: (round.roundNumber || 1) + 1,
      previousSelectedPlayerId: round.selectedPlayerId
    })
  }

  async function handleEndGame() {
    if (isHost) await endSession(code).catch(console.error)
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
      ? getPunishmentLabel({ gameMode: 'casual', punishmentLevel: session.settings.punishmentLevel })
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

        <div className="game-screen__round-badge">
          <div className="game-screen__round-dot" />
          <span className="game-screen__round-label">Runde {round.roundNumber}</span>
        </div>

        <div className="game-screen__header-actions">
          {/* Streak indicator */}
          {streak >= 2 && (
            <div className="game-screen__streak">
              <span className="game-screen__streak-label">🔥 {streak}x</span>
            </div>
          )}
          {/* Sip counter */}
          {sipCount > 0 && (
            <div className="game-screen__sip-counter">
              <span className="game-screen__sip-counter-label">🍺 {sipCount}</span>
            </div>
          )}
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

                {/* Challenge card */}
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
                    <p className="game-screen__punishment-hint">⚡ {punishmentLabel}</p>
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
                  <>
                    <p className="game-screen__waiting-text">
                      Warte auf {selectedPlayer?.name}…
                    </p>
                    {/* Spectator mini-dare */}
                    {spectatorDare && (
                      <motion.div
                        className="game-screen__spectator-dare"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <span className="game-screen__spectator-dare-label">
                          ⚡ Mini-Dare für dich
                        </span>
                        <p className="game-screen__spectator-dare-text">{spectatorDare}</p>
                        <button
                          className="game-screen__spectator-dare-skip"
                          onClick={() => setSpectatorDare(getRandomSpectatorDare())}
                        >
                          Andere →
                        </button>
                      </motion.div>
                    )}
                  </>
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
              // Richtigen Recorder je nach proofType anzeigen
              round.proofType === 'photo' ? (
                <PhotoProofRecorder onUploaded={handleProofUploaded} />
              ) : round.proofType === 'audio' ? (
                <AudioProofRecorder onUploaded={handleProofUploaded} />
              ) : (
                <VideoProofRecorder onUploaded={handleProofUploaded} />
              )
            ) : (
              <div className="game-screen__spectator">
                <span className="game-screen__spectator-icon">
                  {round.proofType === 'photo' ? '📸' : round.proofType === 'audio' ? '🎤' : '🎥'}
                </span>
                <p className="game-screen__spectator-text">
                  {selectedPlayer?.name}{' '}
                  {round.proofType === 'photo'
                    ? 'macht ein Foto…'
                    : round.proofType === 'audio'
                    ? 'nimmt Audio auf…'
                    : 'nimmt die Challenge auf…'}
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
            {/* Beweis je nach Typ anzeigen */}
            {round.proofUrl && round.proofType === 'photo' && (
              <img
                className="game-screen__proof-photo"
                src={round.proofUrl}
                alt="Beweis"
              />
            )}
            {round.proofUrl && round.proofType === 'audio' && (
              <audio
                className="game-screen__proof-audio"
                src={round.proofUrl}
                controls
              />
            )}
            {round.proofUrl && (!round.proofType || round.proofType === 'video') && (
              <video
                className="game-screen__proof-video"
                src={round.proofUrl}
                controls
                playsInline
              />
            )}

            <div className="game-screen__vote-progress">
              <span className="eyebrow">
                {Object.keys(round.votes || {}).length} / {eligibleVoters.length} abgestimmt
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
                Die anderen stimmen ab…
              </p>
            ) : hasVoted ? (
              <motion.p
                className="game-screen__waiting-text"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Stimme abgegeben ✓
              </motion.p>
            ) : (
              <>
                <p className="game-screen__vote-question">Geschafft?</p>
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
              transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }}
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
                  ? 'Alle trinken! 🍻'
                  : round.outcome === 'success'
                  ? `${selectedPlayer?.name} hat's! 🎉`
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

            {/* Scoreboard with medals */}
            <motion.div
              className="game-screen__scoreboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
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
                        transition={{ delay: 0.3 + i * 0.05 }}
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

            {/* Timed-Modus: Countdown für alle, Host kann überspringen */}
            {session.settings?.roundMode === 'timed' && countdown !== null ? (
              <motion.div
                className="game-screen__next-countdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <p className="game-screen__next-countdown-label">Nächste Runde in</p>
                <p className="game-screen__next-countdown-time">
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </p>
                {isHost && (
                  <div className="game-screen__result-actions">
                    <button className="btn-primary" onClick={handleNextRound}>
                      ⚡ Jetzt starten
                    </button>
                    <button className="game-screen__end-game" onClick={handleEndGame}>
                      Spiel beenden
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Direct-Modus: Host startet manuell */
              isHost && session.settings?.roundMode !== 'timed' && (
                <div className="game-screen__result-actions">
                  <button className="btn-primary" onClick={handleNextRound}>
                    Nächste Runde
                  </button>
                  <button className="game-screen__end-game" onClick={handleEndGame}>
                    Spiel beenden
                  </button>
                </div>
              )
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
