import { Routes, Route } from 'react-router-dom'
import { usePlayer } from './lib/usePlayer'
import LandingPage from './pages/LandingPage'
import NameScreen from './pages/NameScreen'
import CharacterScreen from './pages/CharacterScreen'
import MainMenu from './pages/MainMenu'
import RulesScreen from './pages/RulesScreen'
import HostSetupScreen from './pages/HostSetupScreen'
import JoinScreen from './pages/JoinScreen'
import LobbyScreen from './pages/LobbyScreen'
import GameScreen from './pages/GameScreen'

export default function App() {
  const { player, setName, setCharacter, resetCharacter } = usePlayer()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/name"
        element={<NameScreen player={player} setName={setName} />}
      />
      <Route
        path="/character"
        element={
          <CharacterScreen
            player={player}
            setCharacter={setCharacter}
            resetCharacter={resetCharacter}
          />
        }
      />
      <Route path="/menu" element={<MainMenu player={player} />} />
      <Route path="/rules" element={<RulesScreen />} />
      <Route path="/host" element={<HostSetupScreen player={player} />} />
      <Route path="/join" element={<JoinScreen />} />
      <Route path="/lobby/:code" element={<LobbyScreen player={player} />} />
      <Route path="/game/:code" element={<GameScreen player={player} />} />
    </Routes>
  )
}
