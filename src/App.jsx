import { Routes, Route } from 'react-router-dom'
import { usePlayer } from './lib/usePlayer'
import LandingPage from './pages/LandingPage'
import NameScreen from './pages/NameScreen'
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
  const {} = useTheme()

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage player={player} />}
      />
      <Route
        path="/name"
        element={
          <NameScreen
            player={player}
            setName={setName}
          />
        }
      />
      <Route
        path="/menu"
        element={<MainMenu player={player} />}
      />
      <Route
        path="/rules"
        element={<RulesScreen />}
      />
      <Route
        path="/host"
        element={<HostSetupScreen player={player} />}
      />
      <Route
        path="/join"
        element={<JoinScreen />}
      />
      <Route
        path="/lobby/:code"
        element={<LobbyScreen player={player} />}
      />
      <Route
        path="/game/:code"
        element={<GameScreen player={player} />}
      />
      <Route
        path="/profile"
        element={<ProfileScreen player={player} resetPlayer={resetPlayer} />}
      />
      <Route
        path="/recap/:code"
        element={<RecapScreen />}
      />
    </Routes>
  )
}
