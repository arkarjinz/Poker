import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import HowToPlay from './pages/HowToPlay'
import Game from './pages/Game'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/play" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
