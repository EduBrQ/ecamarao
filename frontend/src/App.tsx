import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Toast from './components/Toast'
import RequireAuth from './components/RequireAuth'
import { ToastProvider, useToastGlobal } from './hooks/useToastGlobal'
import Login from './pages/Login'
import Home from './pages/Home'
import Viveiro from './pages/Viveiro'
import Dashboard from './pages/Dashboard'
import Racao from './pages/Racao'
import Anotacoes from './pages/Anotacoes'
import Mortalidade from './pages/Mortalidade'
import Aeradores from './pages/Aeradores'
import FazendaRacao from './pages/FazendaRacao'
import Ciclo from './pages/Ciclo'
import './styles/Toast.css'

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
        <Route path="/viveiro/:id/dashboard" element={<Dashboard />} />
        <Route path="/viveiro/:id/racao" element={<Racao />} />
        <Route path="/viveiro/:id/anotacoes" element={<Anotacoes />} />
        <Route path="/viveiro/:id/mortalidade" element={<Mortalidade />} />
        <Route path="/viveiro/:id/ciclo" element={<Ciclo />} />
        <Route path="/viveiro/:id/aeradores" element={<Aeradores />} />
        <Route path="/fazenda/racao" element={<FazendaRacao />} />
      </Route>
    </Routes>
  )
}

function ToastRenderer() {
  const toast = useToastGlobal()
  return <Toast messages={toast.messages} onRemove={toast.removeMessage} />
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
      <ToastRenderer />
    </ToastProvider>
  )
}

export default App
