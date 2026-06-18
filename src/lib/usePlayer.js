import { useState, useCallback } from 'react'

const STORAGE_KEY = 'daredrop_player'

function readStoredPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { name: '', characterId: null }
    const parsed = JSON.parse(raw)
    return {
      name: parsed.name || '',
      characterId: parsed.characterId || null
    }
  } catch {
    return { name: '', characterId: null }
  }
}

/**
 * Verwaltet den lokalen Spieler-Zustand (Name + gewählter Charakter).
 * Der Name ist dauerhaft (über Sessions hinweg), der Charakter wird
 * pro Session neu gewählt (siehe resetCharacter), wie im Brief gefordert:
 * "Character selection resets every new session. Names remain custom."
 */
export function usePlayer() {
  const [player, setPlayer] = useState(readStoredPlayer)

  const setName = useCallback((name) => {
    setPlayer((prev) => {
      const next = { ...prev, name }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setCharacter = useCallback((characterId) => {
    setPlayer((prev) => {
      const next = { ...prev, characterId }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetCharacter = useCallback(() => {
    setPlayer((prev) => {
      const next = { ...prev, characterId: null }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  /**
   * Löscht den Spieler komplett — Name, Charakter, Player-ID und
   * alle anderen App-Daten aus localStorage. Danach ist die App
   * im Zustand wie beim allerersten Besuch.
   */
  const resetPlayer = useCallback(() => {
    const keysToRemove = [
      STORAGE_KEY,
      'daredrop_player_id',
      'daredrop_local_stats',
      'daredrop_last_session',
      'daredrop_theme',
      'daredrop_sound_enabled',
    ]
    keysToRemove.forEach((k) => {
      try { localStorage.removeItem(k) } catch { }
    })
    setPlayer({ name: '', characterId: null })
  }, [])

  return { player, setName, setCharacter, resetCharacter, resetPlayer }
}
