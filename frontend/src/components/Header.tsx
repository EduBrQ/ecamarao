import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const isHome = location.pathname === '/home-page' || location.pathname === '/'
  
  // Mapeamento de nomes de páginas para exibição
  const getPageTitle = (pathname: string) => {
    const pageMap: { [key: string]: string } = {
      '/home-page': 'Início',
      '/': 'Início',
      '/fazenda-racao': 'Controle de Alimentação',
      '/viveiro': 'Viveiros',
      '/dashboard': 'Dashboard',
      '/relatorios': 'Relatórios',
      '/configuracoes': 'Configurações'
    }
    
    // Para rotas dinâmicas como /viveiro/123
    if (pathname.includes('/viveiro/') && pathname.includes('/racao')) {
      return 'Detalhes do Viveiro'
    }
    
    return pageMap[pathname] || 'AquaFarm'
  }
  
  const currentPageTitle = getPageTitle(location.pathname)

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          {!isHome && (
            <button 
              className="header-back" 
              onClick={() => navigate(-1)} 
              aria-label="Voltar para página anterior"
              title="Voltar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          
          <div className="header-brand" onClick={() => navigate('/home-page')}>
            <img
              className="header-logo"
              src="/img/shrimp.png"
              alt="Logo AquaFarm"
              loading="lazy"
            />
            <div className="header-divider" />
            <h1 className="header-title">AquaFarm</h1>
          </div>
          
          <div className="header-info">
            <span className="header-page-title">{currentPageTitle}</span>
          </div>
          
          <button
            className="header-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="header-menu-overlay" onClick={() => setIsMenuOpen(false)}>
            <nav className="header-menu" onClick={(e) => e.stopPropagation()}>
              <div className="header-menu-header">
                <h2>Menu</h2>
                <button
                  className="header-menu-close"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <ul className="header-menu-list">
                <li className="header-menu-item">
                  <button 
                    className={`header-menu-link ${location.pathname === '/home-page' || location.pathname === '/' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/home-page')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                    Início
                  </button>
                </li>
                <li className="header-menu-item">
                  <button 
                    className={`header-menu-link ${location.pathname === '/fazenda-racao' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/fazenda-racao')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    Controle de Alimentação
                  </button>
                </li>
                <li className="header-menu-item">
                  <button 
                    className={`header-menu-link ${location.pathname === '/viveiro' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/viveiro')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="9" x2="15" y2="9"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Viveiros
                  </button>
                </li>
                <li className="header-menu-item">
                  <button 
                    className={`header-menu-link ${location.pathname === '/relatorios' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/relatorios')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    Relatórios
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>
      
      {/* Overlay para mobile quando menu está aberto */}
      {isMenuOpen && (
        <div className="header-backdrop" onClick={() => setIsMenuOpen(false)} />
      )}
    </>
  )
}

export default Header
