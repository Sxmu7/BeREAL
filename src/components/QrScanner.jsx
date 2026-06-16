import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import './QrScanner.css'

/**
 * Scannt per Kamera nach einem QR-Code, der nur den reinen
 * Lobby-Code als Text enthält (kein URL, siehe QrCodeDisplay) –
 * damit beim Scannen mit einer fremden Kamera-App keine Domain
 * sichtbar wird, sondern nur der Code selbst.
 */
export default function QrScanner({ onScanned, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [error, setError] = useState(null)
  const hasScannedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        tick()
      } catch (err) {
        console.error(err)
        setError('Kamera-Zugriff nicht möglich. Bitte Berechtigung erteilen.')
      }
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || hasScannedRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(imageData.data, imageData.width, imageData.height)

        if (result?.data) {
          // Nur reine Codes akzeptieren (5 Zeichen, A-Z/2-9), keine URLs –
          // falls doch jemand einen anderen QR-Code in die Kamera hält.
          const candidate = result.data.trim().toUpperCase()
          const looksLikeCode = /^[A-Z2-9]{4,6}$/.test(candidate)
          if (looksLikeCode) {
            hasScannedRef.current = true
            onScanned(candidate)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    start()

    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onScanned])

  return (
    <div className="qr-scanner">
      <video ref={videoRef} className="qr-scanner__video" muted playsInline />
      <canvas ref={canvasRef} className="qr-scanner__canvas" />

      <div className="qr-scanner__frame" />

      {error && <p className="qr-scanner__error">{error}</p>}

      <button className="qr-scanner__close" onClick={onClose}>
        Abbrechen
      </button>
    </div>
  )
}
