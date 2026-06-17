const STORAGE_KEY = 'daredrop_sound_enabled'

/**
 * Sound- & Haptik-Grundgerüst (Brief: "Optional aktivierbar: Karten
 * Sound, Erfolgs Sound, Countdown Sound, Vibration bei wichtigen
 * Events"). Töne werden synthetisch über die Web Audio API erzeugt
 * statt aus externen Audiodateien geladen – das funktioniert ohne
 * zusätzliche Assets und ohne Netzwerk-Ladezeit, was auf einer Party
 * mit wechselndem WLAN/Empfang ein echter Vorteil ist. Wer eigene,
 * "echte" Soundeffekte einbauen möchte, kann play() einfach durch
 * `new Audio('/sounds/x.mp3').play()` ersetzen.
 */

let audioContext = null

function getAudioContext() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioContext = new Ctx()
  }
  return audioContext
}

export function isSoundEnabled() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // ignorieren, falls localStorage nicht verfügbar ist
  }
}

function playTone({ frequency, duration, type = 'sine', volume = 0.15, delay = 0 }) {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency
  gainNode.gain.value = volume

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  const startTime = ctx.currentTime + delay
  gainNode.gain.setValueAtTime(volume, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

export function playCardSound() {
  playTone({ frequency: 420, duration: 0.12, type: 'triangle', volume: 0.12 })
}

export function playSuccessSound() {
  playTone({ frequency: 523, duration: 0.14, type: 'sine', volume: 0.16 })
  playTone({ frequency: 659, duration: 0.18, type: 'sine', volume: 0.16, delay: 0.1 })
  playTone({ frequency: 784, duration: 0.22, type: 'sine', volume: 0.16, delay: 0.2 })
}

export function playFailSound() {
  playTone({ frequency: 220, duration: 0.25, type: 'sawtooth', volume: 0.1 })
}

export function playCountdownTickSound() {
  playTone({ frequency: 880, duration: 0.08, type: 'square', volume: 0.1 })
}

export function playCountdownGoSound() {
  playTone({ frequency: 392, duration: 0.1, type: 'square', volume: 0.14 })
  playTone({ frequency: 587, duration: 0.18, type: 'square', volume: 0.14, delay: 0.08 })
}

/**
 * Vibration bei wichtigen Events. Funktioniert nur auf Geräten/
 * Browsern mit Vibration-API-Unterstützung (primär Android Chrome;
 * iOS Safari unterstützt das aktuell nicht), daher immer mit
 * Feature-Check und stillem Fallback.
 */
export function vibrate(pattern = 80) {
  if (!isSoundEnabled()) return
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}
