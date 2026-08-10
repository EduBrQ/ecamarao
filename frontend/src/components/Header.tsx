import { useNavigate, useLocation } from 'react-router-dom'
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
          <button className="header-back" onClick={() => navigate(-1)} aria-label="Voltar">
            &#8592;
          </button>
        )}
        <img
          className="header-logo"
          src="/img/shrimp.svg"
          alt="Logo"
          onClick={() => navigate('/home-page')}
          style={{ cursor: 'pointer' }}
        />
        <div className="header-divider" />
        <h1 className="header-title">AquaFarm</h1>
        <button className="header-back" style={{ marginLeft: 'auto' }} onClick={handleLogout} aria-label="Sair">
          Sair
        </button>
      </div>
    </header>
  )
}

export default Header
