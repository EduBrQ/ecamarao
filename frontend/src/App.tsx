import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ToastProvider } from '@edubrq/design-system'
import Header from './components/Header'
import Footer from './components/Footer'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Home from './pages/Home'
import Viveiro from './pages/Viveiro'
import VisaoGeral from './pages/VisaoGeral'
import Racao from './pages/Racao'
import Anotacoes from './pages/Anotacoes'
import Mortalidade from './pages/Mortalidade'
import Aeradores from './pages/Aeradores'
import FazendaRacao from './pages/FazendaRacao'
import Configuracoes from './pages/Configuracoes'

function AppLayout() {
  return (
    <RequireAuth>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </RequireAuth>
  )
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/home-page" replace />} />
        <Route path="/home-page" element={<Home />} />
        <Route path="/viveiro/:id" element={<Viveiro />} />
        <Route path="/viveiro/:id/visao-geral" element={<VisaoGeral />} />
        <Route path="/viveiro/:id/racao" element={<Racao />} />
        <Route path="/viveiro/:id/anotacoes" element={<Anotacoes />} />
        <Route path="/viveiro/:id/mortalidade" element={<Mortalidade />} />
        <Route path="/viveiro/:id/aeradores" element={<Aeradores />} />
        <Route path="/fazenda/racao" element={<FazendaRacao />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
