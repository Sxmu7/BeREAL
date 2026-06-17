import './ThemeToggle.css'

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
