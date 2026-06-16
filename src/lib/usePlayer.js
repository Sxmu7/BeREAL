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

  return { player, setName, setCharacter, resetCharacter }
}
