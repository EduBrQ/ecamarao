import React from 'react';
import { FarmStatus } from '../types';
import './FarmStatusCard.css';

interface FarmStatusCardProps {
  status: FarmStatus;
  loading?: boolean;
}

/**
 * Card de status geral da fazenda com métricas principais
 */
export const FarmStatusCard: React.FC<FarmStatusCardProps> = ({ 
  status, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="farm-status-card loading">
        <div className="loading-spinner">⏳ Carregando...</div>
      </div>
    );
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
          <div className="status-value">{status.saudeGeral} / 100</div>
          <div className="status-label">Saúde Geral</div>
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(status.saudeGeral) }}
          >
            {getStatusLabel(status.saudeGeral)}
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-value">{status.biomassaTotal.toFixed(0)} kg</div>
          <div className="status-label">Biomassa Total</div>
          <div className="status-badge">📈 Crescimento ativo</div>
        </div>
        
        <div className="status-card">
          <div className="status-value">{status.racaoHoje.toFixed(1)} kg</div>
          <div className="status-label">Ração Hoje</div>
          <div className="status-badge">
            de {status.recomendadoHoje.toFixed(1)} kg recomendados
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-value">{status.alertasAtivos}</div>
          <div className="status-label">Alertas Ativos</div>
          <div className="status-badge">⚠️ Precisam atenção</div>
        </div>
      </div>
    </div>
  );
};
