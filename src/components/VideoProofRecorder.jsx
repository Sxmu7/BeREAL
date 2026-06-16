import { useRef, useState, useEffect, useCallback } from 'react'
import './VideoProofRecorder.css'

const MIN_SECONDS = 5
const MAX_SECONDS = 12 // etwas unter den 15s aus dem Brief, damit die Dateigröße sicherer unter dem Firestore-Limit bleibt
const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576 // 1 MB, hartes Firestore-Limit pro Dokument
const SAFE_VIDEO_BYTES_BUDGET = 700_000 // Sicherheitspuffer für den Rest des Dokuments (Settings, Spieler, Votes, Base64-Overhead ~33%)
const TARGET_VIDEO_BITRATE = 250_000 // niedrige Bitrate, damit 12s Video unter dem Budget bleiben

/**
 * Nimmt ein kurzes Beweisvideo auf (5–12s) und speichert es als
 * Base64-String direkt im Firestore-Dokument (currentRound.proofData),
 * statt in Firebase Storage. Das vermeidet den Blaze-Plan, den Storage
 * inzwischen für neue Projekte voraussetzt – auf Kosten der Qualität:
 * niedrige Auflösung/Bitrate, damit das Video unter Firestores
 * 1-MB-Dokumentgrenze bleibt.
 *
 * Falls später doch auf Firebase Storage umgestiegen wird (z.B. wenn
 * der Blaze-Plan ohnehin für Cloud Functions aktiviert wird), kann
 * diese Komponente 1:1 durch die Storage-Variante ersetzt werden –
 * die Schnittstelle nach außen (onUploaded(proofData)) bleibt gleich,
 * nur dass proofData dann eine URL statt ein Base64-String ist.
 */
export default function VideoProofRecorder({ onUploaded }) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('preparing') // preparing | ready | recording | reviewing | tooLarge | uploading | error
  const [elapsed, setElapsed] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 480 },
            height: { ideal: 854 }
          },
          audio: true
        })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setPhase('ready')
      } catch (err) {
        console.error(err)
        setError(
          'Kamera-Zugriff nicht möglich. Bitte Berechtigung erteilen oder über HTTPS öffnen.'
        )
        setPhase('error')
      }
    }
    setupCamera()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []

    // Niedrige Bitrate erzwingen, damit die Dateigröße kontrollierbar
    // bleibt – sonst entscheidet der Browser selbst und das Video
    // kann je nach Gerät deutlich größer werden als nötig.
    const options = {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm',
      videoBitsPerSecond: TARGET_VIDEO_BITRATE
    }

    const recorder = new MediaRecorder(streamRef.current, options)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setPhase(blob.size > SAFE_VIDEO_BYTES_BUDGET ? 'tooLarge' : 'reviewing')
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setPhase('recording')
    setElapsed(0)
  }

  useEffect(() => {
    if (phase !== 'recording') return
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= MAX_SECONDS) {
          stopRecording()
        }
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

  async function handleUpload() {
    if (!recordedBlob) return
    setPhase('uploading')
    try {
      const base64 = await blobToBase64(recordedBlob)
      onUploaded(base64)
    } catch (err) {
      console.error(err)
      setError('Verarbeitung fehlgeschlagen. Bitte erneut versuchen.')
      setPhase('reviewing')
    }
  }

  function handleRetake() {
    setRecordedBlob(null)
    setElapsed(0)
    setPhase('ready')
  }

  if (phase === 'error') {
    return (
      <div className="video-proof video-proof--error">
        <p>{error}</p>
      </div>
    )
  }

  const sizeKb = recordedBlob ? Math.round(recordedBlob.size / 1024) : 0

  return (
    <div className="video-proof">
      {phase !== 'reviewing' && phase !== 'uploading' && phase !== 'tooLarge' && (
        <video ref={videoRef} className="video-proof__preview" autoPlay muted playsInline />
      )}

      {(phase === 'reviewing' || phase === 'uploading' || phase === 'tooLarge') &&
        recordedBlob && (
          <video
            className="video-proof__preview"
            src={URL.createObjectURL(recordedBlob)}
            controls
            playsInline
          />
        )}

      {phase === 'recording' && (
        <div className="video-proof__rec-badge">
          <span className="video-proof__rec-dot" />
          {elapsed}s
        </div>
      )}

      <div className="video-proof__actions">
        {phase === 'ready' && (
          <button className="btn-primary" onClick={startRecording}>
            Aufnahme starten
          </button>
        )}

        {phase === 'recording' && (
          <button
            className="btn-secondary"
            disabled={elapsed < MIN_SECONDS}
            onClick={stopRecording}
          >
            {elapsed < MIN_SECONDS
              ? `Noch ${MIN_SECONDS - elapsed}s mindestens`
              : 'Aufnahme beenden'}
          </button>
        )}

        {phase === 'reviewing' && (
          <>
            <button className="btn-secondary" onClick={handleRetake}>
              Neu aufnehmen
            </button>
            <button className="btn-primary" onClick={handleUpload}>
              Hochladen
            </button>
          </>
        )}

        {phase === 'tooLarge' && (
          <button className="btn-secondary" onClick={handleRetake}>
            Kürzer neu aufnehmen
          </button>
        )}

        {phase === 'uploading' && (
          <p className="video-proof__uploading">Lädt hoch…</p>
        )}
      </div>

      {phase === 'reviewing' && recordedBlob && (
        <p className="video-proof__size-hint">{sizeKb} KB · passt ins Limit</p>
      )}

      {phase === 'tooLarge' && (
        <p className="video-proof__error">
          Video ist mit {sizeKb} KB zu groß (Limit ~{Math.round(SAFE_VIDEO_BYTES_BUDGET / 1024)} KB).
          Bitte kürzer aufnehmen oder weniger Bewegung im Bild.
        </p>
      )}

      {error && phase === 'reviewing' && (
        <p className="video-proof__error">{error}</p>
      )}
    </div>
  )
}
