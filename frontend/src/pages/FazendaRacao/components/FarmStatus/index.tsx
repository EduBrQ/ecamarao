import React from 'react';
import { DashboardResponse } from '../../types/dashboard';
import { useFarmStatus } from '../../hooks/useFarmStatus';
import './styles.css';

interface FarmStatusProps {
  dashboard: DashboardResponse | null;
}

/**
 * Componente que exibe o status geral da fazenda
 * Saúde, biomassa, ração e alertas
 */
export const FarmStatus: React.FC<FarmStatusProps> = ({ dashboard }) => {
  const { saudeGeral, fcrMedio } = useFarmStatus(dashboard);

  if (!dashboard) {
    return <div className="farm-status-loading">Carregando...</div>;
  }

  const getStatusColor = (score: number) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusLabel = (score: number) => {
    if (score >= 85) return '🟢 Excelente';
    if (score >= 70) return '🟡 Bom';
    if (score >= 50) return '🟠 Atenção';
    return '🔴 Crítico';
  };

  const alertasAtivos = dashboard.viveiros.filter(v => {
    const scoreSaude = v.fcrAtual > 2.5 || v.biomassa < 100;
    return scoreSaude;
  }).length;

  return (
    <div className="farm-status-container">
      <div className="farm-status-header">
        <h2>🏭 STATUS DA FAZENDA</h2>
        <span className="farm-status-date">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>
      
      <div className="farm-status-grid">
        <div className="status-card">
          <div className="status-value">{saudeGeral} / 100</div>
          <div className="status-label">Saúde Geral</div>
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(saudeGeral) }}
          >
            {getStatusLabel(saudeGeral)}
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-value">{dashboard.totais.totalBiomassa.toFixed(0)} kg</div>
          <div className="status-label">Biomassa Total</div>
          <div className="status-badge">📈 Crescimento ativo</div>
        </div>
        
        <div className="status-card">
          <div className="status-value">{dashboard.totais.totalRacaoHoje.toFixed(1)} kg</div>
          <div className="status-label">Ração Hoje</div>
          <div className="status-badge">
            de {dashboard.totais.totalRecomendado.toFixed(1)} kg recomendados
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-value">{alertasAtivos}</div>
          <div className="status-label">Alertas Ativos</div>
          <div className="status-badge">⚠️ Precisam atenção</div>
        </div>
      </div>
    </div>
  );
};
