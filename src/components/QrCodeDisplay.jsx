import { QRCodeSVG } from 'qrcode.react'
import './QrCodeDisplay.css'

/**
 * Zeigt den Lobby-Code als QR-Code. Bewusst wird NUR der reine Code
 * (z.B. "AB3FQ") kodiert, keine vollständige URL – sonst würde jede
 * Kamera-App beim Scannen die Domain/den Hosting-Anbieter offenlegen.
 * Die DareDrop-App selbst (über QrScanner) erkennt den reinen Code
 * und trägt ihn automatisch im Join-Screen ein.
 */
export default function QrCodeDisplay({ code, size = 180 }) {
  return (
    <div className="qr-code-display glass">
      <QRCodeSVG
        value={code}
        size={size}
        bgColor="transparent"
        fgColor="#f2f1f4"
        level="M"
        includeMargin
      />
    </div>
  )
}
