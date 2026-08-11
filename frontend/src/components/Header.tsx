import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, LogOut, Settings } from 'lucide-react'
import { IconButton } from '@edubrq/design-system'
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
          <IconButton variant="ghost" onClick={() => navigate(-1)} aria-label="Voltar" icon={<ArrowLeft size={20} />} />
        )}
        <button className="header-brand" onClick={() => navigate('/home-page')}>
          <img className="header-logo" src="/img/shrimp.svg" alt="" />
          <span className="header-title">ecamarao</span>
        </button>
        <div className="header-spacer" />
        <IconButton variant="ghost" onClick={() => navigate('/configuracoes')} aria-label="Configurações" icon={<Settings size={20} />} />
        <IconButton variant="ghost" onClick={handleLogout} aria-label="Sair" icon={<LogOut size={20} />} />
      </div>
    </header>
  )
}

export default Header
