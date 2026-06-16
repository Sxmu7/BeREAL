// Charaktere aus dem Brief. Jeder bekommt ein Emoji-Icon und eine
// Akzentfarbe, damit er auf dem Wheel und in der Lobby sofort
// unterscheidbar ist, auch ohne den Namen zu lesen.
export const CHARACTERS = [
  { id: 'maverick', name: 'Maverick', icon: '🛩️', color: '#FF2D7A' },
  { id: 'shadow', name: 'Shadow', icon: '🖤', color: '#7C5CFF' },
  { id: 'blaze', name: 'Blaze', icon: '🔥', color: '#FF6A2D' },
  { id: 'luna', name: 'Luna', icon: '🌙', color: '#5CC8FF' },
  { id: 'joker', name: 'Joker', icon: '🃏', color: '#00E5C7' },
  { id: 'nova', name: 'Nova', icon: '⚡', color: '#FFD23F' },
  { id: 'frost', name: 'Frost', icon: '❄️', color: '#9BE8FF' },
  { id: 'king', name: 'King', icon: '👑', color: '#FFB020' }
]

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || null
}
