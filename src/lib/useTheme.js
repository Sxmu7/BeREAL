import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'daredrop_theme'

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage nicht verfügbar, z.B. in manchen privaten Modi
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

/**
 * Verwaltet Light/Dark-Theme. Setzt data-theme="dark" am <html>
 * Element, damit die CSS-Variablen aus tokens.css greifen. Nutzt
 * beim ersten Besuch die System-Präferenz, danach die explizite
 * Wahl der Person aus localStorage.
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignorieren, falls localStorage nicht verfügbar ist
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
