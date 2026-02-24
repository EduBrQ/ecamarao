import { useNavigate, useLocation } from 'react-router-dom'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/home-page' || location.pathname === '/'

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
          src="/img/shrimp.png"
          alt="Logo"
          onClick={() => navigate('/home-page')}
          style={{ cursor: 'pointer' }}
        />
        <div className="header-divider" />
        <h1 className="header-title">E-Camarao</h1>
      </div>
    </header>
  )
}

export default Header
