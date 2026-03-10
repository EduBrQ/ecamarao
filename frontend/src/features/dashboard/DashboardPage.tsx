import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardResponse } from '../../domains/fazenda/types';
import { useFarmStatus } from '../../domains/fazenda/hooks/useFarmStatus';
import { FarmStatusCard } from '../../domains/fazenda/components/FarmStatusCard';
import { ViveiroCard } from '../../domains/viveiros/components/ViveiroCard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { VisualMode, FilterType } from '../../domains/viveiros/types';
import './DashboardPage.css';

/**
 * Página principal do Dashboard com arquitetura modular
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook principal de dados
  const { dashboard, loading, error } = useDashboardData();
  
  // Hooks de domínio
  const { status } = useFarmStatus(dashboard);
  
  // Estados locais para UI
  const [visualMode, setVisualMode] = useState<VisualMode>('grid');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

  // Renderização condicional
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner">🔄 Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">Falha ao carregar dados do dashboard</div>
          <div className="error-details">{error}</div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <div className="empty-icon">📋</div>
          <div className="empty-message">Nenhum dado disponível</div>
        </div>
      </div>
    );
  }

  // Filtrar viveiros baseado no filtro ativo
  const viveirosFiltrados = dashboard.viveiros.filter(viveiro => {
    if (activeFilter === 'todos') return true;
    
    const hoje = new Date().toISOString().split('T')[0];
    const racaoHoje = viveiro.racoes.find(r => r.data.split('T')[0] === hoje);
    const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
    const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
    
    switch (activeFilter) {
      case 'pendentes':
        return !alimentouManha && !alimentouTarde;
      case 'alimentados':
        return alimentouManha && alimentouTarde;
      case 'parciais':
        return (alimentouManha || alimentouTarde) && !(alimentouManha && alimentouTarde);
      default:
        return true;
    }
  });

  return (
    <div className="dashboard-container">
      {/* Header Principal */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">🦐 AquaFarm Dashboard</h1>
            <p className="dashboard-subtitle">Gestão inteligente de carcinicultura</p>
          </div>
          <div className="header-actions">
            <button className="export-btn primary">
              📊 Exportar CSV
            </button>
            <button className="export-btn secondary">
              📄 Gerar PDF
            </button>
          </div>
        </div>
      </header>

      {/* STATUS DA FAZENDA */}
      <FarmStatusCard status={status.status} />

      {/* MAPA DE VIVEIROS */}
      <section className="viveiros-section">
        <div className="section-header">
          <h2>🗺️ MAPA DA FAZENDA</h2>
          <div className="section-controls">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${activeFilter === 'todos' ? 'active' : ''}`}
                onClick={() => setActiveFilter('todos')}
              >
                📊 Todos ({dashboard.viveiros.length})
              </button>
              <button 
                className={`filter-tab ${activeFilter === 'pendentes' ? 'active' : ''}`}
                onClick={() => setActiveFilter('pendentes')}
              >
                ⚠️ Pendentes ({status.viveirosPendentes})
              </button>
              <button 
                className={`filter-tab ${activeFilter === 'alimentados' ? 'active' : ''}`}
                onClick={() => setActiveFilter('alimentados')}
              >
                ✅ Alimentados ({status.viveirosAlimentados})
              </button>
              <button 
                className={`filter-tab ${activeFilter === 'parciais' ? 'active' : ''}`}
                onClick={() => setActiveFilter('parciais')}
              >
                🌅 Parciais ({status.viveirosParciais})
              </button>
            </div>
            <div className="visual-controls">
              <button 
                className={`visual-btn ${visualMode === 'grid' ? 'active' : ''}`}
                onClick={() => setVisualMode('grid')}
              >
                📦 Grade
              </button>
              <button 
                className={`visual-btn ${visualMode === 'list' ? 'active' : ''}`}
                onClick={() => setVisualMode('list')}
              >
                📋 Lista
              </button>
            </div>
          </div>
        </div>

        <div className={`viveiros-container ${visualMode}`}>
          {viveirosFiltrados.map((viveiro) => (
            <ViveiroCard
              key={viveiro.viveiro.id}
              viveiro={viveiro}
              onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
