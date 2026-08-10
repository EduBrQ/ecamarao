import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, LogOut, Settings } from 'lucide-react'
import { auth } from '../services/backendApi'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/home-page' || location.pathname === '/'

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-inner">
        {!isHome && (
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
        )}
        <button className="header-brand" onClick={() => navigate('/home-page')}>
          <img className="header-logo" src="/img/shrimp.svg" alt="" />
          <span className="header-title">ecamarao</span>
        </button>
        <div className="header-spacer" />
        <button className="icon-btn" onClick={() => navigate('/configuracoes')} aria-label="Configurações">
          <Settings size={20} />
        </button>
        <button className="icon-btn" onClick={handleLogout} aria-label="Sair">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}

export default Header
