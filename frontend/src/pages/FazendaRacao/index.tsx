import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastGlobal } from '../../../hooks/useToastGlobal';
import { DashboardResponse, VisualMode, FilterType } from './types/dashboard';
import { FarmStatus } from './components/FarmStatus';
import { useDashboardData } from './hooks/useDashboardData';
import { useFarmStatus } from './hooks/useFarmStatus';
import { usePondSelection } from './hooks/usePondSelection';
import { gerarEventosFazenda } from './services/eventsGenerator';
import { normalizeDate } from './utils/dateUtils';
import './styles/layouts.css';

/**
 * Componente principal do Dashboard AquaFarm
 * Refatorado para melhor organização e manutenibilidade
 */
export const FazendaRacao: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToastGlobal();
  
  // Hooks customizados
  const { dashboard, loading, error, totalRacaoHoje, refetchData } = useDashboardData();
  const { viveirosAlimentados, viveirosParciais, viveirosPendentes } = useFarmStatus(dashboard);
  const { selectedViveiro, selectViveiro, clearSelection } = usePondSelection();
  
  // Estados locais para UI
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [visualMode, setVisualMode] = useState<VisualMode>('grid');

  // Estados para modais (mantidos do código original)
  const [quantidadeModal, setQuantidadeModal] = useState<{
    isOpen: boolean;
    viveiroId: number;
    periodo: 'manha' | 'tarde';
    quantidade: string;
  }>({
    isOpen: false,
    viveiroId: 0,
    periodo: 'manha',
    quantidade: ''
  });

  // Funções de navegação (mantidas do código original)
  const handleAlimentacaoRapida = (viveiroId: number, periodo: 'manha' | 'tarde') => {
    setQuantidadeModal({
      isOpen: true,
      viveiroId,
      periodo,
      quantidade: ''
    });
  };

  const handleStatusClick = (tipo: 'completo' | 'parcial' | 'pendente') => {
    // Implementação original mantida
    console.log('Status click:', tipo);
  };

  // Renderização condicional
  if (loading) {
    return <div className="dashboard-loading">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Erro: {error}</div>;
  }

  if (!dashboard) {
    return <div className="dashboard-empty">Nenhum dado disponível</div>;
  }

  // Gerar eventos para o feed
  const eventos = gerarEventosFazenda(dashboard.viveiros);

  return (
    <div className="fazenda-dashboard-container">
      {/* Header Principal */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">🦐 AquaFarm Dashboard</h1>
            <p className="dashboard-subtitle">Gestão inteligente de carcinicultura</p>
          </div>
          <div className="header-actions">
            <button 
              className="export-btn primary"
              onClick={() => {/* Implementar exportação CSV */}}
            >
              📊 Exportar CSV
            </button>
            <button 
              className="export-btn secondary"
              onClick={() => {/* Implementar exportação PDF */}}
            >
              📄 Gerar PDF
            </button>
          </div>
        </div>
      </header>

      {/* STATUS DA FAZENDA */}
      <FarmStatus dashboard={dashboard} />

      {/* MAPA DA FAZENDA - Nova Zona Central */}
      <div className="farm-map-section">
        <div className="section-header">
          <h2>🗺️ MAPA DA FAZENDA</h2>
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

        <div className="farm-map-content">
          {/* Mapa visual será implementado em componente separado */}
          <div className="map-placeholder">
            <p>Mapa visual será implementado aqui</p>
            <p>Viveiros: {dashboard.viveiros.length}</p>
            <p>Selecionado: {selectedViveiro?.viveiro.nome || 'Nenhum'}</p>
          </div>
        </div>
      </div>

      {/* EVENTOS DA FAZENDA */}
      <div className="events-section">
        <h2>📅 EVENTOS DA FAZENDA</h2>
        <div className="events-content">
          {eventos.length === 0 ? (
            <div className="no-events">
              <div className="no-events-icon">📋</div>
              <div className="no-events-title">Nenhum evento hoje</div>
              <div className="no-events-subtitle">Os eventos aparecerão aqui conforme as atividades do dia</div>
            </div>
          ) : (
            <div className="events-list">
              {eventos.map((evento) => (
                <div key={evento.id} className={`event-item ${evento.tipo}`}>
                  <div className="event-icon">
                    {evento.tipo === 'alimentacao' ? '🍤' : 
                     evento.tipo === 'alerta' ? '⚠️' : '✅'}
                  </div>
                  <div className="event-content">
                    <div className="event-time">{evento.horario}</div>
                    <div className="event-message">{evento.mensagem}</div>
                    {evento.detalhes && (
                      <div className="event-details">{evento.detalhes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FazendaRacao;
