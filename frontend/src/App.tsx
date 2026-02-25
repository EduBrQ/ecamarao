import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Viveiro from './pages/Viveiro'
import Dashboard from './pages/Dashboard'
import Racao from './pages/Racao'
import Anotacoes from './pages/Anotacoes'
import Mortalidade from './pages/Mortalidade'
import Aeradores from './pages/Aeradores'
import FazendaRacao from './pages/FazendaRacao'
import { ViveirosListBackend } from './pages/ViveirosListBackend'
import Ciclo from './pages/Ciclo'

function App() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home-page" replace />} />
          <Route path="/home-page" element={<Home />} />
          <Route path="/viveiro/:id" element={<Viveiro />} />
          <Route path="/viveiro/:id/dashboard" element={<Dashboard />} />
          <Route path="/viveiro/:id/racao" element={<Racao />} />
          <Route path="/viveiro/:id/anotacoes" element={<Anotacoes />} />
          <Route path="/viveiro/:id/mortalidade" element={<Mortalidade />} />
          <Route path="/viveiro/:id/ciclo" element={<Ciclo />} />
          <Route path="/viveiro/:id/aeradores" element={<Aeradores />} />
          <Route path="/fazenda/racao" element={<FazendaRacao />} />
          <Route path="/viveiros-backend" element={<ViveirosListBackend />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
