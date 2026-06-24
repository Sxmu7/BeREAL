import { useRef, useState, useEffect, useCallback } from 'react'
import './AudioProofRecorder.css'

// Firestore 1 MB budget – gleiche Berechnung wie VideoProofRecorder:
// (1_048_576 − 8_000 overhead) × 3/4 × 0.92 ≈ 718 KB Rohgröße erlaubt
const SAFE_RAW_BYTES = Math.floor(((1_048_576 - 8_000) * 3) / 4 * 0.92)

// Mit 128 kbps Opus ergeben sich ~44 Sekunden Aufnahme-Budget.
// Wir nutzen 44 s – und stoppen automatisch, bevor das Budget überschritten wird.
const MIN_SECONDS = 2
const MAX_SECONDS = 44

// Höchste Bitrate die WebM/Opus-Browser unterstützen: 128 kbps
const TARGET_BITRATE = 128_000

export default function AudioProofRecorder({ onUploaded }) {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('ready') // ready | recording | reviewing | uploading | error
  const [elapsed, setElapsed] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [sizeKb, setSizeKb] = useState(null)
  const [overBudget, setOverBudget] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      // Bevorzuge hohe Bitrate + Opus-Codec
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: TARGET_BITRATE,
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url  = URL.createObjectURL(blob)
        const kb   = Math.round(blob.size / 1024)
        // Prüfen ob Blob ins Firestore-Budget passt
        const tooLarge = blob.size > SAFE_RAW_BYTES
        setAudioBlob(blob)
        setAudioUrl(url)
        setSizeKb(kb)
        setOverBudget(tooLarge)
        setPhase('reviewing')
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setPhase('recording')
      setElapsed(0)
    } catch {
      setError('Mikrofon-Zugriff nicht möglich. Bitte Berechtigung erteilen.')
      setPhase('error')
    }
  }

  // Auto-stop at MAX_SECONDS
  useEffect(() => {
    if (phase !== 'recording') return
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= MAX_SECONDS) stopRecording()
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, stopRecording])

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function handleSubmit() {
    if (!audioBlob) return
    setPhase('uploading')
    try {
      const base64 = await blobToBase64(audioBlob)
      onUploaded(base64)
    } catch {
      setError('Verarbeitung fehlgeschlagen. Bitte erneut versuchen.')
      setPhase('reviewing')
    }
  }

  function handleRetake() {
    setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setSizeKb(null)
    setOverBudget(false)
    setElapsed(0)
    setPhase('ready')
  }

  if (phase === 'error') {
    return (
      <div className="audio-proof audio-proof--error">
        <p>{error}</p>
      </div>
    )
  }

  const budgetKb = Math.round(SAFE_RAW_BYTES / 1024)
  const fillPct  = sizeKb ? Math.min(Math.round((sizeKb / budgetKb) * 100), 100) : 0
  const timeLeft = MAX_SECONDS - elapsed

  return (
    <div className="audio-proof">
      {/* Visual indicator */}
      <div className={`audio-proof__orb ${phase === 'recording' ? 'audio-proof__orb--active' : ''}`}>
        {phase === 'ready'     && <span>🎤</span>}
        {phase === 'recording' && <span className="audio-proof__wave">🔴</span>}
        {phase === 'reviewing' && <span>{overBudget ? '⚠️' : '✓'}</span>}
        {phase === 'uploading' && <span>⏳</span>}
      </div>

      {/* Timer */}
      {phase === 'recording' && (
        <div className="audio-proof__timer-wrap">
          <p className="audio-proof__timer">{elapsed}s</p>
          <p className="audio-proof__timer-max">max {MAX_SECONDS}s · {timeLeft}s übrig</p>
        </div>
      )}

      {/* Audio player */}
      {(phase === 'reviewing' || phase === 'uploading') && audioUrl && (
        <>
          <audio className="audio-proof__player" src={audioUrl} controls />
          {/* Budget-Bar */}
          <div className="audio-proof__budget-bar">
            <div
              className={`audio-proof__budget-fill ${overBudget ? 'audio-proof__budget-fill--over' : ''}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className={`audio-proof__size ${overBudget ? 'audio-proof__size--over' : ''}`}>
            {sizeKb} KB / {budgetKb} KB
            {overBudget && ' · Zu groß – kürzer aufnehmen!'}
          </p>
        </>
      )}

      {/* Actions */}
      <div className="audio-proof__actions">
        {phase === 'ready' && (
          <button className="btn-primary" onClick={startRecording}>
            🎤 Aufnahme starten
          </button>
        )}

        {phase === 'recording' && (
          <button
            className="btn-secondary"
            disabled={elapsed < MIN_SECONDS}
            onClick={stopRecording}
          >
            {elapsed < MIN_SECONDS
              ? `Noch ${MIN_SECONDS - elapsed}s…`
              : '⏹ Aufnahme stoppen'}
          </button>
        )}

        {phase === 'reviewing' && (
          <>
            <button className="btn-secondary" onClick={handleRetake}>
              Neu aufnehmen
            </button>
            {!overBudget && (
              <button className="btn-primary" onClick={handleSubmit}>
                Senden ✓
              </button>
            )}
          </>
        )}

        {phase === 'uploading' && (
          <p className="audio-proof__status">Wird gesendet…</p>
        )}
      </div>
    </div>
  )
}
