// Charaktere aus dem Brief. Jeder bekommt ein Emoji-Icon. Die Auswahl
// wird einheitlich mit dem App-Akzent hervorgehoben statt mit einer
// eigenen Farbe pro Charakter – das hält das Bild ruhig.
export const CHARACTERS = [
  { id: 'maverick', name: 'Maverick', icon: '🛩️' },
  { id: 'shadow', name: 'Shadow', icon: '🖤' },
  { id: 'blaze', name: 'Blaze', icon: '🔥' },
  { id: 'luna', name: 'Luna', icon: '🌙' },
  { id: 'joker', name: 'Joker', icon: '🃏' },
  { id: 'nova', name: 'Nova', icon: '⚡' },
  { id: 'frost', name: 'Frost', icon: '❄️' },
  { id: 'king', name: 'King', icon: '👑' }
]

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || null
}

/**
 * Weist einem Spieler anhand seines Namens deterministisch einen
 * Charakter zu. Der gleiche Name bekommt immer das gleiche Icon —
 * kein manuelles Auswählen nötig, aber stabil über Reload-Grenzen.
 */
export function assignCharacterByName(name) {
  if (!name) return CHARACTERS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
  }
  return CHARACTERS[Math.abs(hash) % CHARACTERS.length]
}
