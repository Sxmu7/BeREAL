import { Routes, Route } from 'react-router-dom'
import { usePlayer } from './lib/usePlayer'
import { useTheme } from './lib/useTheme'
import LandingPage from './pages/LandingPage'
import NameScreen from './pages/NameScreen'
import CharacterScreen from './pages/CharacterScreen'
import MainMenu from './pages/MainMenu'
import RulesScreen from './pages/RulesScreen'
import HostSetupScreen from './pages/HostSetupScreen'
import JoinScreen from './pages/JoinScreen'
import LobbyScreen from './pages/LobbyScreen'
import GameScreen from './pages/GameScreen'
import ProfileScreen from './pages/ProfileScreen'
import RecapScreen from './pages/RecapScreen'

export default function App() {
  const { player, setName, setCharacter, resetCharacter, resetPlayer } = usePlayer()
  const { theme, toggleTheme } = useTheme()

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage player={player} theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/name"
        element={
          <NameScreen
            player={player}
            setName={setName}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        }
      />
      <Route
        path="/character"
        element={
          <CharacterScreen
            player={player}
            setCharacter={setCharacter}
            resetCharacter={resetCharacter}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        }
      />
      <Route
        path="/menu"
        element={<MainMenu player={player} theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/rules"
        element={<RulesScreen theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/host"
        element={<HostSetupScreen player={player} theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/join"
        element={<JoinScreen theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/lobby/:code"
        element={<LobbyScreen player={player} theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/game/:code"
        element={<GameScreen player={player} theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/profile"
        element={<ProfileScreen player={player} resetPlayer={resetPlayer} theme={theme} toggleTheme={toggleTheme} />}
      />
      <Route
        path="/recap/:code"
        element={<RecapScreen theme={theme} toggleTheme={toggleTheme} />}
      />
    </Routes>
  )
}
