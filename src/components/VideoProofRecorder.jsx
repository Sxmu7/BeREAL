import { useRef, useState, useEffect, useCallback } from 'react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import './VideoProofRecorder.css'

const MIN_SECONDS = 5
const MAX_SECONDS = 15

/**
 * Nimmt ein kurzes Beweisvideo auf (5–15s) und lädt es zu Firebase
 * Storage hoch. Pfad: proofs/{sessionCode}/{roundNumber}_{playerId}.webm
 * Das Löschen nach Abstimmung übernimmt im Idealfall eine Cloud
 * Function (siehe README "Storage-Cleanup") statt Client-Code, damit
 * es zuverlässig passiert auch wenn jemand die App vorher schließt.
 */
export default function VideoProofRecorder({ sessionCode, roundNumber, playerId, onUploaded }) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('preparing') // preparing | ready | recording | reviewing | uploading | error
  const [elapsed, setElapsed] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
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
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setPhase('reviewing')
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

  async function handleUpload() {
    if (!recordedBlob) return
    setPhase('uploading')
    try {
      const path = `proofs/${sessionCode}/${roundNumber}_${playerId}.webm`
      const ref = storageRef(storage, path)
      await uploadBytes(ref, recordedBlob)
      const url = await getDownloadURL(ref)
      onUploaded(url)
    } catch (err) {
      console.error(err)
      setError('Upload fehlgeschlagen. Prüfe deine Internetverbindung.')
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

  return (
    <div className="video-proof">
      {phase !== 'reviewing' && phase !== 'uploading' && (
        <video ref={videoRef} className="video-proof__preview" autoPlay muted playsInline />
      )}

      {(phase === 'reviewing' || phase === 'uploading') && recordedBlob && (
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

        {phase === 'uploading' && (
          <p className="video-proof__uploading">Lädt hoch…</p>
        )}
      </div>

      {error && phase === 'reviewing' && (
        <p className="video-proof__error">{error}</p>
      )}
    </div>
  )
}
