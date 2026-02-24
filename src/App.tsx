import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Viveiro from './pages/Viveiro'
import Racao from './pages/Racao'
import Aeradores from './pages/Aeradores'
import Cameras from './pages/Cameras'
import Anotacoes from './pages/Anotacoes'
import Feedbacks from './pages/Feedbacks'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home-page" replace />} />
          <Route path="/home-page" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/viveiro/:id" element={<Viveiro />} />
          <Route path="/viveiro/:id/racao" element={<Racao />} />
          <Route path="/viveiro/:id/aeradores" element={<Aeradores />} />
          <Route path="/viveiro/:id/cameras" element={<Cameras />} />
          <Route path="/viveiro/:id/anotacoes" element={<Anotacoes />} />
          <Route path="/viveiro/:id/feedbacks" element={<Feedbacks />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
