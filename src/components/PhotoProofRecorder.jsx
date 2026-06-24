import { useRef, useState, useEffect } from 'react'
import './PhotoProofRecorder.css'

// Gleiches Budget wie VideoProofRecorder (Firestore 1 MB Limit):
// (1_048_576 − 8_000 overhead) × 3/4 × 0.92 ≈ 701 KB Rohdaten
const SAFE_RAW_BYTES = Math.floor(((1_048_576 - 8_000) * 3) / 4 * 0.92)

// Max-Breite – verhindert nur absurd große Smartphone-Kameras (>4K),
// ansonsten wird die native Auflösung der Kamera genutzt.
const MAX_WIDTH = 3840

// Adaptive JPEG-Qualitätsstufen – wir starten hoch und gehen runter
// bis das Bild ins Budget passt. Die meisten Party-Fotos passen bei 0.90.
const QUALITY_STEPS = [0.95, 0.88, 0.78, 0.65, 0.50, 0.35]

/**
 * Komprimiert ein Canvas-Bild adaptiv bis es ins Firestore-Budget passt.
 * Gibt dataUrl, geschätzte Rohgröße und verwendete Qualitätsstufe zurück.
 */
async function compressToFit(canvas) {
  for (const quality of QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    // Base64-Teil: alles nach dem Komma. Jede 4 Base64-Chars = 3 Rohbytes.
    const b64Part = dataUrl.slice(dataUrl.indexOf(',') + 1)
    const rawBytes = Math.floor(b64Part.length * 0.75)
    if (rawBytes <= SAFE_RAW_BYTES) {
      return { dataUrl, rawBytes, quality }
    }
  }
  // Absoluter Fallback (sollte nie vorkommen)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.2)
  return { dataUrl, rawBytes: 0, quality: 0.2 }
}

export default function PhotoProofRecorder({ onUploaded }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('preparing')
  // preparing | ready | compressing | taken | uploading | error
  const [result, setResult] = useState(null)  // { dataUrl, rawBytes, quality }
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function setup() {
      try {
        // Höchste verfügbare Kameraauflösung anfordern
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
          audio: false
        })
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setPhase('ready')
      } catch {
        setError('Kamera-Zugriff nicht möglich. Bitte Berechtigung erteilen.')
        setPhase('error')
      }
    }
    setup()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function takePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setPhase('compressing')

    // Native Auflösung nutzen, nur bei absurden Dimensionen skalieren
    const ratio = Math.min(MAX_WIDTH / video.videoWidth, 1)
    canvas.width  = Math.round(video.videoWidth  * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const compressed = await compressToFit(canvas)
    setResult(compressed)
    setPhase('taken')

    // Kamera-Stream stoppen — wird nicht mehr gebraucht
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function retake() {
    setResult(null)
    setPhase('preparing')
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 3840 }, height: { ideal: 2160 } },
      audio: false
    }).then((stream) => {
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setPhase('ready')
    }).catch(() => {
      setError('Kamera konnte nicht neu gestartet werden.')
      setPhase('error')
    })
  }

  function handleSubmit() {
    if (!result) return
    setPhase('uploading')
    onUploaded(result.dataUrl)
  }

  if (phase === 'error') {
    return (
      <div className="photo-proof photo-proof--error">
        <p>{error}</p>
      </div>
    )
  }

  const sizeKb    = result ? Math.round(result.rawBytes / 1024) : null
  const budgetKb  = Math.round(SAFE_RAW_BYTES / 1024)
  const fillPct   = result ? Math.round((result.rawBytes / SAFE_RAW_BYTES) * 100) : 0
  const qualityPct = result ? Math.round(result.quality * 100) : null

  return (
    <div className="photo-proof">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Kamera-Preview */}
      {(phase === 'preparing' || phase === 'ready') && (
        <video
          ref={videoRef}
          className="photo-proof__preview"
          autoPlay muted playsInline
        />
      )}

      {/* Komprimierungs-Spinner */}
      {phase === 'compressing' && (
        <div className="photo-proof__compressing">
          <span className="photo-proof__spinner" />
          <p>Optimiere Bildqualität…</p>
        </div>
      )}

      {/* Aufgenommenes Foto */}
      {(phase === 'taken' || phase === 'uploading') && result && (
        <div className="photo-proof__taken-wrap">
          <img
            className={`photo-proof__preview ${phase === 'uploading' ? 'photo-proof__preview--uploading' : ''}`}
            src={result.dataUrl}
            alt="Dein Beweis"
          />
          {/* Budget-Bar */}
          <div className="photo-proof__budget-bar">
            <div
              className="photo-proof__budget-fill"
              style={{ width: `${Math.min(fillPct, 100)}%` }}
            />
          </div>
          <p className="photo-proof__size">
            {sizeKb} KB / {budgetKb} KB · JPEG {qualityPct}% Qualität
          </p>
        </div>
      )}

      {/* Aktionen */}
      <div className="photo-proof__actions">
        {phase === 'ready' && (
          <button className="btn-primary" onClick={takePhoto}>
            📸 Foto aufnehmen
          </button>
        )}

        {phase === 'taken' && (
          <>
            <button className="btn-secondary" onClick={retake}>
              Neu aufnehmen
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              Senden ✓
            </button>
          </>
        )}

        {(phase === 'preparing' || phase === 'compressing' || phase === 'uploading') && (
          <p className="photo-proof__status">
            {phase === 'preparing'   ? 'Kamera wird geladen…'
             : phase === 'compressing' ? 'Qualität wird optimiert…'
             : 'Wird gesendet…'}
          </p>
        )}
      </div>
    </div>
  )
}
