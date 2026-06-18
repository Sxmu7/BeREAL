import { useState, useCallback } from 'react'
import { assignCharacterByName } from './characters'

const STORAGE_KEY = 'daredrop_player'

function readStoredPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { name: '', characterId: null }
    const parsed = JSON.parse(raw)
    // Falls kein characterId gespeichert, jetzt automatisch zuweisen
    const characterId = parsed.characterId || (parsed.name ? assignCharacterByName(parsed.name).id : null)
    return { name: parsed.name || '', characterId }
  } catch {
    return { name: '', characterId: null }
  }
}

export function usePlayer() {
  const [player, setPlayer] = useState(readStoredPlayer)

  const setName = useCallback((name) => {
    setPlayer((prev) => {
      // Charakter automatisch aus dem Namen ableiten – kein manuelles Auswählen mehr
      const character = assignCharacterByName(name)
      const next = { ...prev, name, characterId: character.id }
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
