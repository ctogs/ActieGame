import { Home } from './pages/Home'
import { GameHost } from './pages/GameHost'
import { GamePlayer } from './pages/GamePlayer'
import { Join } from './pages/Join'
import { WaitingRoom } from './pages/WaitingRoom'
import { HostWaitRoom } from './pages/HostWaitRoom'
import { LeaderBoard } from './pages/LeaderBoard'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import './App.css'


function App() {
  return (
    <>
      <a href="/">Go Home</a>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host/:roomID" element={<GameHost/>} />
          <Route path="/player/:roomID" element={<GamePlayer/>} />
          <Route path="/join" element={<Join/>} />
          <Route path="/waiting-room/:roomID" element={<WaitingRoom />} />
          <Route path="/host-waitroom/:roomID" element={<HostWaitRoom />} />
          <Route path="/leaderboard/:roomID" element={<LeaderBoard />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
