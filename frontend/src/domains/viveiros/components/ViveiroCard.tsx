import React from 'react';
import { ViveiroDashboard } from '../types';
import { useViveiroStatus } from '../hooks/useViveiroStatus';
import { calcularScoreSaude } from '../services/healthCalculator';
import './ViveiroCard.css';

interface ViveiroCardProps {
  viveiro: ViveiroDashboard;
  onClick?: () => void;
  showActions?: boolean;
}

/**
 * Card de viveiro reutilizável com todas as métricas essenciais
 */
export const ViveiroCard: React.FC<ViveiroCardProps> = ({ 
  viveiro, 
  onClick, 
  showActions = true 
}) => {
  const { statusAlimentacao, alimentouManha, alimentouTarde, percentualRecomendado, precisaAtencao } = useViveiroStatus(viveiro);
  const scoreSaude = calcularScoreSaude(viveiro);

  return (
    <div 
      className={`viveiro-card ${statusAlimentacao} ${precisaAtencao ? 'needs-attention' : ''}`}
      onClick={onClick}
    >
      {/* Score de Saúde */}
      <div className="viveiro-health-score">
        <div className="health-header">
          <span className="health-label">Saúde</span>
          <div 
            className="health-score-value"
            style={{ backgroundColor: scoreSaude.cor }}
          >
            <span className="health-score-number">{scoreSaude.score}</span>
            <span className="health-score-max">/100</span>
          </div>
        </div>
        <div className="health-status">
          <span className={`health-indicator ${scoreSaude.status}`}>
            {scoreSaude.status === 'excelente' ? '🟢 Excelente' : 
             scoreSaude.status === 'bom' ? '🟢 Bom' : 
             scoreSaude.status === 'atencao' ? '🟡 Atenção' : '🔴 Crítico'}
          </span>
        </div>
      </div>

      {/* Header do Viveiro */}
      <div className="viveiro-header">
        <div className="viveiro-title-row">
          <h3 className="viveiro-name">{viveiro.viveiro.nome}</h3>
          <span className="viveiro-doc">{viveiro.doc} dias</span>
        </div>
        
        <div className="viveiro-status">
          <div className={`feed-status ${statusAlimentacao}`}>
            {statusAlimentacao === 'complete' ? '✅' : 
             statusAlimentacao === 'partial' ? '🌅' : '⏳'}
            <span>{statusAlimentacao === 'complete' ? 'Completo' : 
                   statusAlimentacao === 'partial' ? 'Parcial' : 'Pendente'}</span>
          </div>
          <div className="feed-amount">
            <strong>{(viveiro.racaoHojeTotal || 0).toFixed(1)} kg</strong>
            <span>/ {viveiro.recomendadoTotal.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="viveiro-metrics">
        <div className="metric-item">
          <span className="metric-label">🦐 Camarões</span>
          <span className="metric-value">{viveiro.populacaoEstimada?.toLocaleString('pt-BR') || '-'}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">⚖️ Biomassa</span>
          <span className="metric-value">{viveiro.biomassa.toFixed(0)} kg</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">📊 FCR</span>
          <span className={`metric-value ${viveiro.fcrAtual > 0 && viveiro.fcrAtual < 1.8 ? 'excellent' : 
                                                  viveiro.fcrAtual > 0 && viveiro.fcrAtual < 2.2 ? 'good' : 'warning'}`}>
            {viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}
            {viveiro.fcrAtual > 0 && (
              <span className="fcr-indicator">
                {viveiro.fcrAtual < 1.8 ? '🟢' : viveiro.fcrAtual < 2.2 ? '🟡' : '🔴'}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Progresso do Dia */}
      <div className="viveiro-progress">
        <div className="progress-header">
          <span className="progress-label">Progresso do Dia</span>
          <span className="progress-percent">{percentualRecomendado.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${statusAlimentacao}`}
            style={{ width: `${Math.min(percentualRecomendado, 100)}%` }}
          />
        </div>
      </div>

      {/* Ações */}
      {showActions && (
        <div className="viveiro-actions">
          <button 
            className={`action-btn manha ${alimentouManha ? 'disabled' : ''}`}
            disabled={alimentouManha}
          >
            🌅 {alimentouManha ? 'Feito' : 'Manhã'}
          </button>
          <button 
            className={`action-btn tarde ${alimentouTarde ? 'disabled' : ''}`}
            disabled={alimentouTarde}
          >
            🌆 {alimentouTarde ? 'Feito' : 'Tarde'}
          </button>
          <button className="action-btn details">
            📋 Detalhes
          </button>
        </div>
      )}
    </div>
  );
};
