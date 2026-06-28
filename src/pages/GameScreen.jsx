import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToSession, endSession, pauseSession, resumeSession, kickPlayer } from '../lib/sessions'
import {
  startNewRound,
  advanceRoundPhase,
  advanceToSpinning,
  setRoundDecision,
  submitProof,
  castVote,
  tallyVotes,
  finalizeRound,
  ensurePlayerStats,
  rerollChallenge,
  skipChallenge,
  setBattleDecision,
  castBattleVote,
  finalizeBattle,
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

  // Refs für de-duplication
  const hasFinalizedRef = useRef(false)
  const lastSoundedRoundRef = useRef(null)
  const lastNotifiedRoundRef = useRef(null)
  const lastVotingNotifiedRef = useRef(null)
  const battleFinalizedRef = useRef(null)
  const autoStartedRef = useRef(false)

  // State
  const [sipCount, setSipCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [spectatorDare, setSpectatorDare] = useState(null)
  const [showHostMenu, setShowHostMenu] = useState(false)
  const lastResultRef = useRef(null)

  // ── Subscribe ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return subscribeToSession(code, setSession, () => navigate('/menu'))
  }, [code, navigate])

  // ── Sound + Vibration bei Ergebnis ───────────────────────────────────────
  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'result' || !round.outcome) return
    const key = `${round.roundNumber}-${round.outcome}`
    if (lastSoundedRoundRef.current === key) return
    lastSoundedRoundRef.current = key
    if (round.outcome === 'success') { playSuccessSound(); vibrate([60, 40, 60]) }
    else { playFailSound(); vibrate(150) }
  }, [session])

  // ── Sip-Counter + Streak ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'result' || !round.outcome) return
    const key = `${round.roundNumber}-${round.outcome}`
    if (lastResultRef.current === key) return
    lastResultRef.current = key
    if (round.outcome === 'success') {
      setStreak(s => s + 1)
    } else if (round.outcome === 'punished' || round.outcome === 'failed') {
      setStreak(0)
      setSipCount(c => c + getSipMultiplier(session.settings?.punishmentLevel))
    }
  }, [session])

  // ── Push: 30s nach Challenge-Start (ausgewählter Spieler) ────────────────
  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'challenge') return
    if (session.hostId !== playerId) return
    if (lastNotifiedRoundRef.current === round.roundNumber) return
    const target = session.players?.find(p => p.id === round.selectedPlayerId)
    if (!target?.fcmToken || target.id === playerId) return
    const lang = session.settings?.language || 'de'
    const title = lang === 'en' ? "⚡ It's your turn!" : '⚡ Du bist dran!'
    const body = (round.challengeText || '').slice(0, 100)
    const timer = setTimeout(() => {
      if (lastNotifiedRoundRef.current === round.roundNumber) return
      lastNotifiedRoundRef.current = round.roundNumber
      sendPushToPlayer(target.fcmToken, title, body)
    }, 30_000)
    return () => clearTimeout(timer)
  }, [session?.currentRound?.roundNumber, session?.currentRound?.phase]) // eslint-disable-line

  // ── Push: Abstimmung gestartet (alle außer ausgewähltem Spieler) ──────────
  useEffect(() => {
    if (!session?.currentRound) return
    const round = session.currentRound
    if (round.phase !== 'voting') return
    if (session.hostId !== playerId) return
    if (lastVotingNotifiedRef.current === round.roundNumber) return
    lastVotingNotifiedRef.current = round.roundNumber
    const lang = session.settings?.language || 'de'
    const selectedName = session.players?.find(p => p.id === round.selectedPlayerId)?.name || '?'
    session.players
      ?.filter(p => p.fcmToken && p.id !== round.selectedPlayerId && p.id !== playerId)
      .forEach(p => {
        const title = lang === 'en' ? '🗳️ Cast your vote!' : '🗳️ Jetzt abstimmen!'
        const body = lang === 'en'
          ? `Did ${selectedName} make it?`
          : `Hat ${selectedName} die Challenge geschafft?`
        sendPushToPlayer(p.fcmToken, title, body)
      })
  }, [session?.currentRound?.phase, session?.currentRound?.roundNumber]) // eslint-disable-line

  // ── Spectator Dare bei Challenge-Phase ───────────────────────────────────
  useEffect(() => {
    if (session?.currentRound?.phase === 'challenge') setSpectatorDare(getRandomSpectatorDare())
  }, [session?.currentRound?.phase])

  // ── Warteraum Countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.nextRoundAt || session?.currentRound?.phase !== 'result') {
      setCountdown(null); return
    }
    autoStartedRef.current = false
    const tick = () => {
      const target = session.nextRoundAt
      const ms = typeof target?.toMillis === 'function'
        ? target.toMillis()
        : target instanceof Date ? target.getTime() : 0
      setCountdown(Math.max(0, Math.ceil((ms - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [session?.nextRoundAt, session?.currentRound?.phase]) // eslint-disable-line

  // ── Auto-Start wenn Countdown 0 ──────────────────────────────────────────
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
      previousSelectedPlayerId: session.currentRound?.selectedPlayerId,
      customChallenges: session.settings?.customChallenges || [],
      battleRoundEvery: session.settings?.battleRoundEvery || 5,
    }).catch(console.error)
  }, [countdown]) // eslint-disable-line

  // ── Battle: Host erkennt wenn beide Spieler entschieden haben ────────────
  useEffect(() => {
    if (!session?.currentRound?.isBattle) return
    const round = session.currentRound
    if (round.phase !== 'challenge') return
    if (session.hostId !== playerId) return
    if (battleFinalizedRef.current === round.roundNumber) return
    const decisions = round.battleDecisions || {}
    const mainDecision = decisions[round.selectedPlayerId]
    const oppDecision = decisions[round.battleOpponentId]
    if (!mainDecision || !oppDecision) return
    battleFinalizedRef.current = round.roundNumber

    const otherVoters = session.players.filter(
      p => p.id !== round.selectedPlayerId && p.id !== round.battleOpponentId
    )
    if (mainDecision !== 'punishment' && oppDecision !== 'punishment' && otherVoters.length > 0) {
      // Beide accepted → Voting
      advanceRoundPhase(code, 'battle-vote').catch(console.error)
    } else {
      finalizeBattle(code, {
        decisions,
        mainId: round.selectedPlayerId,
        oppId: round.battleOpponentId,
        stats: session.stats || {},
        battleVotes: null,
      }).catch(console.error)
    }
  }, [JSON.stringify(session?.currentRound?.battleDecisions)]) // eslint-disable-line

  // ── Host startet erste Runde ──────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    if (session.hostId !== playerId) return
    if (session.status === 'active' && !session.currentRound) {
      startNewRound(code, {
        players: session.players,
        difficulty: session.settings.difficulty,
        locationMode: session.settings.locationMode,
        language: session.settings.language || 'de',
        roundNumber: 1,
        customChallenges: session.settings?.customChallenges || [],
        battleRoundEvery: session.settings?.battleRoundEvery || 5,
      }).catch(console.error)
    }
  }, [session, code, playerId])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!session || !session.currentRound) {
    return (
      <div className="game-screen game-screen--centered">
        <p className="game-screen__loading">Runde wird vorbereitet…</p>
      </div>
    )
  }

  // ── Derived State ─────────────────────────────────────────────────────────
  const round = session.currentRound
  const isSelected = round.selectedPlayerId === playerId
  const isBattleOpponent = round.isBattle && round.battleOpponentId === playerId
  const isHost = session.hostId === playerId
  const selectedPlayer = session.players.find(p => p.id === round.selectedPlayerId)
  const battleOpponent = round.isBattle
    ? session.players.find(p => p.id === round.battleOpponentId)
    : null
  const eligibleVoters = session.players.filter(p => p.id !== round.selectedPlayerId)
  const eligibleBattleVoters = round.isBattle
    ? session.players.filter(p => p.id !== round.selectedPlayerId && p.id !== round.battleOpponentId)
    : []
  const hasVoted = !!round.votes?.[playerId]
  const hasBattleVoted = !!round.battleVotes?.[playerId]
  const hasUsedSkip = (session.stats?.[playerId]?.skips || 0) >= 1

  const locationMeta = LOCATION_META[session.settings.locationMode] || { emoji: '⚡', label: session.settings.locationMode }
  const difficultyLevel = DIFF_LEVELS[session.settings.difficulty] || 2

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSpinComplete() {
    if (isHost) setTimeout(() => advanceRoundPhase(code, 'challenge').catch(console.error), 1400)
  }

  function handleCountdownDone() {
    if (isHost) advanceToSpinning(code).catch(console.error)
  }

  async function handleDecision(decision) {
    if (!isSelected) return
    playCardSound(); vibrate(40)
    await setRoundDecision(code, decision, round.proofType || 'photo')
  }

  async function handleProofUploaded(url) {
    await submitProof(code, url)
  }

  async function handleVote(vote) {
    if (isSelected || hasVoted) return
    playCardSound(); vibrate(40)
    const updatedVotes = await castVote(code, round.votes || {}, playerId, vote)
    checkAndFinalize(updatedVotes, false)
  }

  function checkAndFinalize(votes, force) {
    const outcome = tallyVotes(votes, eligibleVoters.map(p => p.id), force)
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
        nextRoundDelayMs: delayMs,
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
    autoStartedRef.current = true
    await startNewRound(code, {
      players: session.players,
      difficulty: session.settings.difficulty,
      locationMode: session.settings.locationMode,
      language: session.settings.language || 'de',
      roundNumber: (round.roundNumber || 1) + 1,
      previousSelectedPlayerId: round.selectedPlayerId,
      customChallenges: session.settings?.customChallenges || [],
      battleRoundEvery: session.settings?.battleRoundEvery || 5,
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
          createdAtMs: session.createdAt?.toMillis?.() || null,
        },
        ownPlayerId: playerId,
      },
    })
  }

  async function handlePauseToggle() {
    setShowHostMenu(false)
    if (session.paused) await resumeSession(code).catch(console.error)
    else await pauseSession(code).catch(console.error)
  }

  async function handleKick(targetId) {
    setShowHostMenu(false)
    await kickPlayer(code, targetId).catch(console.error)
  }

  function handleReroll() {
    rerollChallenge(
      code,
      session.settings.difficulty,
      session.settings.locationMode,
      session.settings.language || 'de',
      session.settings.customChallenges || []
    ).catch(console.error)
  }

  async function handleSkip() {
    if (hasUsedSkip) return
    await skipChallenge(code, playerId, session.stats || {}).catch(console.error)
  }

  async function handleBattleDecision(decision) {
    playCardSound(); vibrate(40)
    await setBattleDecision(code, playerId, decision).catch(console.error)
  }

  async function handleBattleVote(winnerPlayerId) {
    if (hasBattleVoted) return
    if (playerId === round.selectedPlayerId || playerId === round.battleOpponentId) return
    playCardSound()
    const updatedVotes = await castBattleVote(code, round.battleVotes || {}, playerId, winnerPlayerId)
    if (isHost && Object.keys(updatedVotes).length >= eligibleBattleVoters.length) {
      finalizeBattle(code, {
        decisions: round.battleDecisions || {},
        mainId: round.selectedPlayerId,
        oppId: round.battleOpponentId,
        stats: session.stats || {},
        battleVotes: updatedVotes,
      }).catch(console.error)
    }
  }

  const punishmentLabel = session.settings.gameMode === 'casual'
    ? getPunishmentLabel({ gameMode: 'casual', punishmentLevel: session.settings.punishmentLevel })
    : getPunishmentLabel({
        gameMode: 'party',
        drink: selectedPlayer?.drink || 'soft',
        punishmentLevel: session.settings.punishmentLevel,
      })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="game-screen">

      {/* ── Pause Overlay ── */}
      {session.paused && (
        <div className="game-screen__pause-overlay">
          <p className="game-screen__pause-icon">⏸</p>
          <p className="game-screen__pause-title">Spiel pausiert</p>
          {isHost ? (
            <button className="btn-primary" onClick={() => resumeSession(code).catch(console.error)}>
              ▶ Weiterspielen
            </button>
          ) : (
            <p className="game-screen__pause-sub">Warte auf den Host…</p>
          )}
        </div>
      )}

      {/* ── Host-Menü Overlay ── */}
      <AnimatePresence>
        {showHostMenu && (
          <motion.div
            className="game-screen__host-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHostMenu(false)}
          >
            <motion.div
              className="game-screen__host-menu"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="game-screen__host-menu-handle" />
              <p className="game-screen__host-menu-title">Host-Optionen</p>
              <button className="game-screen__host-menu-btn" onClick={handlePauseToggle}>
                {session.paused ? '▶ Weiterspielen' : '⏸ Spiel pausieren'}
              </button>
              {session.players.filter(p => !p.isHost).length > 0 && (
                <>
                  <div className="game-screen__host-menu-divider" />
                  <p className="game-screen__host-menu-section">Spieler entfernen</p>
                  {session.players.filter(p => !p.isHost).map(p => (
                    <div key={p.id} className="game-screen__host-menu-player">
                      <span>{getCharacterById(p.characterId)?.icon || '🎮'} {p.name}</span>
                      <button className="game-screen__kick-btn" onClick={() => handleKick(p.id)}>
                        × raus
                      </button>
                    </div>
                  ))}
                </>
              )}
              <button className="game-screen__host-menu-cancel" onClick={() => setShowHostMenu(false)}>
                Schließen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="game-screen__header">
        <button className="game-screen__back-btn" onClick={() => navigate('/menu')} aria-label="Verlassen">
          ‹
        </button>

        <div className="game-screen__round-badge">
          <div className="game-screen__round-dot" />
          <span className="game-screen__round-label">
            {round.isBattle ? '⚔️ Battle' : `Runde ${round.roundNumber}`}
          </span>
        </div>

        <div className="game-screen__header-actions">
          {streak >= 2 && (
            <div className="game-screen__streak">
              <span className="game-screen__streak-label">🔥 {streak}x</span>
            </div>
          )}
          {sipCount > 0 && (
            <div className="game-screen__sip-counter">
              <span className="game-screen__sip-counter-label">🍺 {sipCount}</span>
            </div>
          )}
          {round.phase !== 'countdown' && round.phase !== 'result' && !round.isBattle && (
            <LiveRanking players={session.players} stats={session.stats} />
          )}
          {isHost && (
            <button className="game-screen__menu-btn" onClick={() => setShowHostMenu(true)}>
              ⚙
            </button>
          )}
        </div>
      </div>

      {/* ── Phase Content ── */}
      <AnimatePresence mode="wait">

        {/* Countdown */}
        {round.phase === 'countdown' && (
          <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="game-screen__phase game-screen__phase--centered">
            <RoundCountdown players={session.players} onDone={handleCountdownDone} />
          </motion.div>
        )}

        {/* Spinning */}
        {round.phase === 'spinning' && (
          <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="game-screen__phase game-screen__phase--centered">
            <WheelSpin players={session.players} selectedPlayerId={round.selectedPlayerId} onSpinComplete={handleSpinComplete} />
          </motion.div>
        )}

        {/* Challenge */}
        {round.phase === 'challenge' && (
          <motion.div key="challenge" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="game-screen__phase">

            {round.isBattle ? (
              /* ── Battle-Challenge ── */
              <>
                <div className="game-screen__battle-banner">⚔️ Battle-Runde!</div>

                <div className="game-screen__battle-players">
                  {[round.selectedPlayerId, round.battleOpponentId].map((pid, idx) => {
                    const p = session.players.find(pp => pp.id === pid)
                    const char = getCharacterById(p?.characterId)
                    const decision = round.battleDecisions?.[pid]
                    return (
                      <div
                        key={pid}
                        className={`game-screen__battle-participant${decision === 'accepted' ? ' game-screen__battle-participant--accepted' : decision === 'punishment' ? ' game-screen__battle-participant--refused' : ''}`}
                      >
                        <span className="game-screen__battle-avatar">{char?.icon || '🎮'}</span>
                        <span className="game-screen__battle-name">{p?.name}</span>
                        {decision && (
                          <span className="game-screen__battle-decision">{decision === 'accepted' ? '✓' : '✕'}</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="game-screen__challenge-card">
                  <div className="game-screen__challenge-glow" />
                  <p className="game-screen__challenge-text">{round.challengeText}</p>
                </div>

                {(isSelected || isBattleOpponent) && !round.battleDecisions?.[playerId] && (
                  <div className="game-screen__decision-actions">
                    <button className="game-screen__btn-refuse" onClick={() => handleBattleDecision('punishment')}>✕ Nein</button>
                    <button className="game-screen__btn-accept" onClick={() => handleBattleDecision('accepted')}>✓ Annehmen</button>
                  </div>
                )}
                {(isSelected || isBattleOpponent) && round.battleDecisions?.[playerId] && (
                  <p className="game-screen__waiting-text">Warte auf den anderen Spieler…</p>
                )}
                {!isSelected && !isBattleOpponent && (
                  <p className="game-screen__waiting-text">Battle läuft…</p>
                )}
              </>
            ) : (
              /* ── Normal Challenge ── */
              <>
                <PartyEventBanner event={round.partyEvent} />

                {round.partyEvent?.effect === 'all_drink' ? (
                  isHost && (
                    <button className="btn-primary" onClick={handleAllDrinkContinue}>
                      Weiter zur nächsten Runde
                    </button>
                  )
                ) : (
                  <>
                    <div className="game-screen__challenge-header">
                      <div className="game-screen__challenge-avatar">
                        {getCharacterById(selectedPlayer?.characterId)?.icon || '🎮'}
                      </div>
                      <span className="game-screen__challenge-player-name">{selectedPlayer?.name}</span>
                      <div className="game-screen__challenge-progress" />
                    </div>

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
                            {[1, 2, 3, 4].map(n => (
                              <span key={n} className={`game-screen__challenge-dot${n <= difficultyLevel ? ' game-screen__challenge-dot--active' : ''}`} />
                            ))}
                          </div>
                        </div>
                        <p className="game-screen__punishment-hint">⚡ {punishmentLabel}</p>
                      </div>
                    </div>

                    {isSelected ? (
                      <>
                        <div className="game-screen__decision-actions">
                          <button className="game-screen__btn-refuse" onClick={() => handleDecision('punishment')}>✕ Nein</button>
                          <button className="game-screen__btn-accept" onClick={() => handleDecision('accepted')}>✓ Annehmen</button>
                        </div>
                        {!hasUsedSkip && (
                          <button className="game-screen__skip-btn" onClick={handleSkip}>
                            ↷ Überspringen (1×)
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="game-screen__waiting-text">Warte auf {selectedPlayer?.name}…</p>
                        {spectatorDare && (
                          <motion.div
                            className="game-screen__spectator-dare"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <span className="game-screen__spectator-dare-label">⚡ Mini-Dare für dich</span>
                            <p className="game-screen__spectator-dare-text">{spectatorDare}</p>
                            <button className="game-screen__spectator-dare-skip" onClick={() => setSpectatorDare(getRandomSpectatorDare())}>
                              Andere →
                            </button>
                          </motion.div>
                        )}
                      </>
                    )}

                    {isHost && (
                      <button className="game-screen__reroll-btn" onClick={handleReroll}>
                        ↻ Andere Challenge
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Recording */}
        {round.phase === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="game-screen__phase">
            {isSelected ? (
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
                  {round.proofType === 'photo' ? 'macht ein Foto…' : round.proofType === 'audio' ? 'nimmt Audio auf…' : 'nimmt die Challenge auf…'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Voting */}
        {round.phase === 'voting' && (
          <motion.div key="voting" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="game-screen__phase">
            {round.proofUrl && round.proofType === 'photo' && (
              <img className="game-screen__proof-photo" src={round.proofUrl} alt="Beweis" />
            )}
            {round.proofUrl && round.proofType === 'audio' && (
              <audio className="game-screen__proof-audio" src={round.proofUrl} controls />
            )}
            {round.proofUrl && (!round.proofType || round.proofType === 'video') && (
              <video className="game-screen__proof-video" src={round.proofUrl} controls playsInline />
            )}

            <div className="game-screen__vote-progress">
              <span className="eyebrow">{Object.keys(round.votes || {}).length} / {eligibleVoters.length} abgestimmt</span>
              <div className="game-screen__vote-progress-bar">
                <motion.div
                  className="game-screen__vote-progress-fill"
                  animate={{ width: `${eligibleVoters.length > 0 ? (Object.keys(round.votes || {}).length / eligibleVoters.length) * 100 : 0}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {isSelected ? (
              <p className="game-screen__waiting-text">Die anderen stimmen ab…</p>
            ) : hasVoted ? (
              <motion.p className="game-screen__waiting-text" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                Stimme abgegeben ✓
              </motion.p>
            ) : (
              <>
                <p className="game-screen__vote-question">Geschafft?</p>
                <div className="game-screen__vote-actions">
                  <motion.button className="game-screen__vote-no" whileTap={{ scale: 0.94 }} onClick={() => handleVote('no')}>✕ Nein</motion.button>
                  <motion.button className="game-screen__vote-yes" whileTap={{ scale: 0.94 }} onClick={() => handleVote('yes')}>✓ Ja</motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Battle Vote */}
        {round.phase === 'battle-vote' && (
          <motion.div key="battle-vote" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="game-screen__phase game-screen__phase--centered">
            <p className="game-screen__vote-question">⚔️ Wer hat gewonnen?</p>
            <div className="game-screen__battle-vote-row">
              {[round.selectedPlayerId, round.battleOpponentId].map(pid => {
                const p = session.players.find(pp => pp.id === pid)
                const char = getCharacterById(p?.characterId)
                const isMe = playerId === pid
                const voteCount = Object.values(round.battleVotes || {}).filter(v => v === pid).length
                return (
                  <motion.button
                    key={pid}
                    className={`game-screen__battle-vote-btn${round.battleVotes?.[playerId] === pid ? ' game-screen__battle-vote-btn--selected' : ''}`}
                    whileTap={{ scale: 0.94 }}
                    disabled={isMe || hasBattleVoted}
                    onClick={() => handleBattleVote(pid)}
                  >
                    <span className="game-screen__battle-vote-avatar">{char?.icon || '🎮'}</span>
                    <span className="game-screen__battle-vote-name">{p?.name}</span>
                    {voteCount > 0 && <span className="game-screen__battle-vote-count">{voteCount} ✓</span>}
                  </motion.button>
                )
              })}
            </div>
            {(isSelected || isBattleOpponent) && (
              <p className="game-screen__waiting-text">Die anderen stimmen ab…</p>
            )}
            {isHost && (
              <button className="game-screen__end-game" style={{ marginTop: 'var(--space-4)' }} onClick={() => {
                finalizeBattle(code, {
                  decisions: round.battleDecisions || {},
                  mainId: round.selectedPlayerId,
                  oppId: round.battleOpponentId,
                  stats: session.stats || {},
                  battleVotes: round.battleVotes || {},
                }).catch(console.error)
              }}>
                Abstimmung beenden
              </button>
            )}
          </motion.div>
        )}

        {/* Result */}
        {round.phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="game-screen__phase game-screen__phase--centered">
            {(round.outcome === 'success' || round.battleWinnerId) && <Confetti />}

            <motion.div
              className="game-screen__result-hero"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }}
            >
              <div className={`game-screen__result-circle${round.outcome === 'success' || round.battleWinnerId ? ' game-screen__result-circle--success' : ' game-screen__result-circle--fail'}`}>
                {round.isBattle
                  ? (round.battleWinnerId ? '⚔️' : '🍻')
                  : round.partyEvent?.effect === 'all_drink'
                  ? '🍻'
                  : round.outcome === 'success'
                  ? '✓'
                  : '✕'}
              </div>
            </motion.div>

            <motion.div className="game-screen__result-text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {round.isBattle ? (
                <>
                  <p className="game-screen__result-title">
                    {round.battleWinnerId
                      ? `${session.players.find(p => p.id === round.battleWinnerId)?.name} gewinnt! 🏆`
                      : 'Beide trinken! 🍻'}
                  </p>
                  {round.battleWinnerId && <p className="game-screen__result-points">+100 Punkte (Battle-Bonus)</p>}
                </>
              ) : (
                <>
                  <p className="game-screen__result-title">
                    {round.partyEvent?.effect === 'all_drink'
                      ? 'Alle trinken! 🍻'
                      : round.outcome === 'success'
                      ? `${selectedPlayer?.name} hat's! 🎉`
                      : round.outcome === 'punished'
                      ? `${selectedPlayer?.name} nimmt die Strafe.`
                      : round.outcome === 'skipped'
                      ? `${selectedPlayer?.name} hat übersprungen.`
                      : `${selectedPlayer?.name} hat's nicht geschafft.`}
                  </p>
                  {round.outcome === 'success' && <p className="game-screen__result-points">+50 Punkte</p>}
                  {round.outcome !== 'success' && round.outcome !== 'skipped' && round.partyEvent?.effect !== 'all_drink' && (
                    <p className="game-screen__punishment-hint">{punishmentLabel}</p>
                  )}
                </>
              )}
            </motion.div>

            {/* Scoreboard */}
            <motion.div className="game-screen__scoreboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <span className="eyebrow">Punktestand</span>
              <div className="game-screen__scoreboard-list">
                {[...session.players]
                  .sort((a, b) => ensurePlayerStats(session.stats, b.id).wins - ensurePlayerStats(session.stats, a.id).wins)
                  .map((p, i) => {
                    const s = ensurePlayerStats(session.stats, p.id)
                    const char = getCharacterById(p.characterId)
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                    return (
                      <motion.div key={p.id} className={`game-screen__scoreboard-row${i === 0 ? ' game-screen__scoreboard-row--first' : ''}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                        <span className="game-screen__scoreboard-rank">{medal || i + 1}</span>
                        <span className="game-screen__scoreboard-icon">{char?.icon || '🎮'}</span>
                        <span className="game-screen__scoreboard-name">{p.name}</span>
                        <span className="game-screen__scoreboard-score">{s.wins} 🏆</span>
                      </motion.div>
                    )
                  })}
              </div>
            </motion.div>

            {/* Timed-Modus Countdown */}
            {session.settings?.roundMode === 'timed' && countdown !== null ? (
              <motion.div className="game-screen__next-countdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <p className="game-screen__next-countdown-label">Nächste Runde in</p>
                <p className="game-screen__next-countdown-time">
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </p>
                {isHost && (
                  <div className="game-screen__result-actions">
                    <button className="btn-primary" onClick={handleNextRound}>⚡ Jetzt starten</button>
                    <button className="game-screen__end-game" onClick={handleEndGame}>Spiel beenden</button>
                  </div>
                )}
              </motion.div>
            ) : (
              isHost && session.settings?.roundMode !== 'timed' && (
                <div className="game-screen__result-actions">
                  <button className="btn-primary" onClick={handleNextRound}>Nächste Runde</button>
                  <button className="game-screen__end-game" onClick={handleEndGame}>Spiel beenden</button>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer für Challenge-Phase */}
      {round.phase === 'challenge' && !round.isBattle && (
        <FullscreenTimer
          totalSeconds={session.settings.challengeTimer}
          label={isSelected ? 'Deine Entscheidungszeit' : `${selectedPlayer?.name} entscheidet`}
          onComplete={() => { if (isSelected) handleDecision('punishment') }}
        />
      )}

      {/* Timer für Voting-Phase */}
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
