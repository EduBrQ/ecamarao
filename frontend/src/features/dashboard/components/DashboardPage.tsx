import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterType, VisualMode } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { ViveiroCard } from '../../viveiros/components/ViveiroCard';
import { Button } from '../../../shared/ui/Button';
import './DashboardPage.css';
import { FarmStatusCard } from './FarmStatusCard';

/**
 * Página principal do Dashboard com arquitetura Feature Slice
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook principal de dados
  const { dashboard, loading, error, refetchData } = useDashboardData();
  
  // Estados locais para UI
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [visualMode, setVisualMode] = useState<VisualMode>('grid');

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
          <Button onClick={refetchData}>Tentar Novamente</Button>
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
            <Button variant="primary">
              📊 Exportar CSV
            </Button>
            <Button variant="success">
              📄 Gerar PDF
            </Button>
          </div>
        </div>
      </header>

      {/* STATUS DA FAZENDA */}
      <FarmStatusCard dashboard={dashboard} />

      {/* MAPA DE VIVEIROS */}
      <section className="viveiros-section">
        <div className="section-header">
          <h2>🗺️ MAPA DA FAZENDA</h2>
          <div className="section-controls">
            <div className="filter-tabs">
              <Button 
                variant={activeFilter === 'todos' ? 'primary' : 'secondary'}
                onClick={() => setActiveFilter('todos')}
              >
                📊 Todos ({dashboard.viveiros.length})
              </Button>
              <Button 
                variant={activeFilter === 'pendentes' ? 'primary' : 'secondary'}
                onClick={() => setActiveFilter('pendentes')}
              >
                ⚠️ Pendentes ({dashboard.totais.viveirosPendentes})
              </Button>
              <Button 
                variant={activeFilter === 'alimentados' ? 'primary' : 'secondary'}
                onClick={() => setActiveFilter('alimentados')}
              >
                ✅ Alimentados ({dashboard.totais.viveirosAlimentados})
              </Button>
              <Button 
                variant={activeFilter === 'parciais' ? 'primary' : 'secondary'}
                onClick={() => setActiveFilter('parciais')}
              >
                🌅 Parciais ({dashboard.totais.viveirosParciais})
              </Button>
            </div>
            <div className="visual-controls">
              <Button 
                variant={visualMode === 'grid' ? 'primary' : 'secondary'}
                onClick={() => setVisualMode('grid')}
              >
                📦 Grade
              </Button>
              <Button 
                variant={visualMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setVisualMode('list')}
              >
                📋 Lista
              </Button>
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
