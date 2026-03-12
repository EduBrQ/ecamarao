import { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { usePondSelection } from './hooks/usePondSelection';
import AquaModal from './components/AquaModal';
import { backendApi } from '../../services/backendApi';
import { useToastGlobal } from '../../hooks/useToastGlobal';
import { normalizeDate } from './utils/dateUtils';
import { generateFeedingReportPDF, collectFeedingData } from './utils/pdfGenerator';
import './styles/layouts.css';
import './styles/aqua-dashboard.css';

// Tipos locais (garantir robustez caso imports quebrem)
type VisualMode = 'grid' | 'list';

function ViveiroPanel({ viveiro, onClose }: { viveiro: any; onClose: () => void }) {
  if (!viveiro) return (
    <div className="aqua-side-panel empty">
      <div className="panel-empty">Selecione um viveiro no mapa</div>
    </div>
  );

  const racaoHoje = viveiro.racoes ? viveiro.racoes.find((r: any) => normalizeDate(r.data) === normalizeDate(new Date())) : null;
  const consumo = viveiro.consumoUltimosDias || [1,2,3,4,5,6];
  const maxConsumo = Math.max(...consumo);

  return (
    <div className="aqua-side-panel">
      <div className="aqua-panel-header">
        <h3 className="aqua-panel-title">VIVEIRO {viveiro.viveiro?.nome || viveiro.nome}</h3>
        <button className="aqua-panel-close" onClick={onClose}>✖</button>
      </div>
      <div className="aqua-panel-body">
        <div className="aqua-panel-section">
          <div className="aqua-panel-section-title">Status do Viveiro</div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">Saúde</span>
            <span className="aqua-panel-metric-value">{viveiro.saude ?? '—'} / 100</span>
          </div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">Biomassa</span>
            <span className="aqua-panel-metric-value">{viveiro.biomassa?.toFixed ? viveiro.biomassa.toFixed(0) : '-'} kg</span>
          </div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">DOC</span>
            <span className="aqua-panel-metric-value">{viveiro.doc}</span>
          </div>
        </div>

        <div className="aqua-panel-section">
          <div className="aqua-panel-section-title">Alimentação Hoje</div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">Fornecido</span>
            <span className="aqua-panel-metric-value">
              {racaoHoje ? `${(racaoHoje.qntManha||0)+(racaoHoje.qntTarde||0)} kg` : '—'}
            </span>
          </div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">Recomendado</span>
            <span className="aqua-panel-metric-value">{viveiro.racaoMeta || '-'} kg</span>
          </div>
        </div>

        <div className="aqua-panel-section">
          <div className="aqua-panel-section-title">Consumo Últimos Dias</div>
          <div className="aqua-sparkline">
            {consumo.map((c: any, i: number) => (
              <div 
                key={i} 
                className="aqua-sparkline-bar" 
                style={{ height: `${(c / maxConsumo) * 100}%` }}
                title={`Dia ${i + 1}: ${c} kg`}
              />
            ))}
          </div>
        </div>

        <div className="aqua-panel-section">
          <div className="aqua-panel-section-title">Produção</div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">Previsão</span>
            <span className="aqua-panel-metric-value">{viveiro.previsaoProducao ?? '-'} t</span>
          </div>
        </div>

        <div className="aqua-panel-section">
          <div className="aqua-panel-section-title">Alertas</div>
          <div className="aqua-panel-metric">
            <span className="aqua-panel-metric-label">
              {(viveiro.alertas && viveiro.alertas.length) ? viveiro.alertas.join(', ') : 'Nenhum'}
            </span>
          </div>
        </div>

        <button 
          className="aqua-btn aqua-btn-primary" 
          onClick={() => window.location.href = `/viveiro/${viveiro.viveiro?.id || viveiro.id}/racao`}
          style={{ width: '100%', marginTop: 'auto' }}
        >
          Ver Detalhes Completos
        </button>
      </div>
    </div>
  );
}


/**
 * Componente principal do Dashboard AquaFarm
 * Refatorado para melhor organização e manutenibilidade
 */
function FazendaRacao() {
  const { dashboard, loading, error, totalRacaoHoje, refetchData } = useDashboardData();
  const toast = useToastGlobal();
  const { selectedViveiro } = usePondSelection();
  const [visualMode, setVisualMode] = useState<VisualMode>('grid');
  const [activeViveiro, setActiveViveiro] = useState<any>(selectedViveiro || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalViveiro, setModalViveiro] = useState<any>(null);
  const [modalRacaoHoje, setModalRacaoHoje] = useState<any>(null);
  const [modalManha, setModalManha] = useState<number>(0);
  const [modalTarde, setModalTarde] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [fillMissingModal, setFillMissingModal] = useState(false);
  const [missingDaysData, setMissingDaysData] = useState<any[]>([]);
  const [fillingSubmitting, setFillingSubmitting] = useState(false);

  // Função para exportar PDF
  const handleExportPDF = () => {
    try {
      // Definir período dos últimos 30 dias (ou personalizar conforme necessário)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Coletar dados do dashboard
      const reportData = collectFeedingData(dashboard, startDate, endDate);
      
      // Gerar PDF
      generateFeedingReportPDF(reportData);
      
      toast.success('PDF gerado com sucesso', 'O relatório foi baixado automaticamente');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF', error?.message || 'Falha na geração do relatório');
    }
  };

  // Função para analisar dias sem registro
  const handleFillMissingDays = () => {
    if (!dashboard) return;
    
    const missingData: any[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Últimos 7 dias

    dashboard.viveiros.forEach((viveiro: any) => {
      const missingDays: any[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const racaoDia = viveiro.racoes?.find((r: any) => normalizeDate(r.data) === normalizeDate(currentDate));
        
        if (!racaoDia || (racaoDia.qntManha === 0 && racaoDia.qntTarde === 0)) {
          missingDays.push({
            date: dateStr,
            dateFormatted: new Date(dateStr).toLocaleDateString('pt-BR'),
            recommendedManha: Number((viveiro.recomendadoTotal ?? viveiro.racaoMeta ?? 0) * 0.5).toFixed(1),
            recommendedTarde: Number((viveiro.recomendadoTotal ?? viveiro.racaoMeta ?? 0) * 0.5).toFixed(1),
            totalRecommended: (viveiro.recomendadoTotal ?? viveiro.racaoMeta ?? 0).toFixed(1)
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (missingDays.length > 0) {
        missingData.push({
          viveiro: viveiro.viveiro?.nome || viveiro.nome,
          viveiroId: viveiro.viveiro?.id || viveiro.id,
          missingDays
        });
      }
    });

    setMissingDaysData(missingData);
    setFillMissingModal(true);
  };

  // Função para preencher ração dos dias faltantes
  const handleConfirmFillMissing = async () => {
    setFillingSubmitting(true);
    
    try {
      for (const viveiroData of missingDaysData) {
        for (const dayData of viveiroData.missingDays) {
          await backendApi.registrarAlimentacaoDia(
            Number(viveiroData.viveiroId),
            dayData.date,
            Number(dayData.recommendedManha),
            Number(dayData.recommendedTarde)
          );
        }
      }

      toast.success('Dias preenchidos com sucesso', `${missingDaysData.length} viveiros atualizados`);
      setFillMissingModal(false);
      setMissingDaysData([]);
      await refetchData();
    } catch (error: any) {
      console.error('Erro ao preencher dias:', error);
      toast.error('Erro ao preencher dias', error?.message || 'Falha ao atualizar registros');
    } finally {
      setFillingSubmitting(false);
    }
  };

  // Função para atualizar valores recomendados
  const updateRecommendedValue = (viveiroIndex: number, dayIndex: number, period: 'manha' | 'tarde', value: string) => {
    const newData = [...missingDaysData];
    const totalRecommended = Number(newData[viveiroIndex].missingDays[dayIndex].recommendedManha) + 
                           Number(newData[viveiroIndex].missingDays[dayIndex].recommendedTarde);
    
    if (period === 'manha') {
      newData[viveiroIndex].missingDays[dayIndex].recommendedManha = value;
    } else {
      newData[viveiroIndex].missingDays[dayIndex].recommendedTarde = value;
    }
    
    newData[viveiroIndex].missingDays[dayIndex].totalRecommended = totalRecommended.toFixed(1);
    setMissingDaysData(newData);
  };


  // Renderização condicional
  if (loading) return <div className="dashboard-loading">Carregando dashboard...</div>;
  if (error) return <div className="dashboard-error">Erro: {error}</div>;
  if (!dashboard) return <div className="dashboard-empty">Nenhum dado disponível</div>;

  // Eventos do dashboard (mantidos para futura implementação)
  // const eventos = gerarEventosFazenda(dashboard.viveiros);

  // Modal handlers
  const handleQuickAdd = (period: 'manha'|'tarde', inc: number) => {
    if (period === 'manha') {
      setModalManha(prev => Math.max(0, Number((prev + inc).toFixed(1))));
    } else {
      setModalTarde(prev => Math.max(0, Number((prev + inc).toFixed(1))));
    }
  }

  const handleConfirmRegister = async () => {
    if (!modalViveiro) return;
    if ((modalManha <= 0) && (modalTarde <= 0)) {
      toast.warning('Quantidade inválida', 'Insira pelo menos uma quantidade maior que 0');
      return;
    }

    try {
      setSubmitting(true);
      const viveiroId = modalViveiro.viveiro?.id || modalViveiro.id;
      const hoje = new Date().toISOString().split('T')[0];

      // Determine effective values: prefer modal inputs, otherwise preserve existing registro if present
      const existingManha = modalRacaoHoje?.qntManha || 0;
      const existingTarde = modalRacaoHoje?.qntTarde || 0;
      const effectiveManha = modalManha > 0 ? modalManha : existingManha;
      const effectiveTarde = modalTarde > 0 ? modalTarde : existingTarde;

      // Registrar ambos os periodos em uma única chamada:
      await backendApi.registrarAlimentacaoDia(Number(viveiroId), hoje, effectiveManha > 0 ? effectiveManha : undefined, effectiveTarde > 0 ? effectiveTarde : undefined);

      toast.success('Alimentação registrada', `Ração atualizada em ${modalViveiro.viveiro?.nome || modalViveiro.nome}`);
      setModalOpen(false);
      setModalViveiro(null);
      setModalManha(0);
      setModalTarde(0);
      await refetchData();
    } catch (err: any) {
      console.error('Erro ao registrar alimentação:', err);
      toast.error('Falha ao registrar', err?.message || 'Erro ao comunicar com servidor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="aqua-dashboard">
      <div className="aqua-panel-action-bar">
        <button className="aqua-button aqua-button-primary" onClick={handleExportPDF}>Exportar PDF</button>
        <button className="aqua-button aqua-button-secondary" onClick={handleFillMissingDays}>Preencher Dias Faltantes</button>
      </div>
      
      {/* Header Principal */}
      <header className="aqua-header">
        <div className="aqua-header-content">
          <h1 className="aqua-title">Controle de Alimentação</h1>
          <p className="aqua-subtitle">Gerenciar alimentação de viveiros</p>
          <div className="aqua-stats-overview">
            <div className="aqua-stat-card">
              <div className="aqua-stat-label">Total Recomendado</div>
              <div className="aqua-stat-value">{(dashboard.totais?.totalRecomendado ?? 0).toFixed(1)} kg</div>
            </div>
            <div className="aqua-stat-card">
              <div className="aqua-stat-label">Total Fornecido</div>
              <div className="aqua-stat-value">{totalRacaoHoje.toFixed(1)} kg</div>
            </div>
            <div className="aqua-stat-card">
              <div className="aqua-stat-label">Progresso</div>
              <div className="aqua-stat-value">
                {dashboard.totais?.totalRecomendado ? 
                  `${Math.round(totalRacaoHoje / dashboard.totais.totalRecomendado * 100)}%` : 
                  '—'
                }
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* STATUS DA FAZENDA */}
      {/* <FarmStatus dashboard={dashboard} /> */}

      {/* Área Principal com Cards de Viveiros */}
      <div className="farm-main">
        <div className="farm-map-area">
          {/* <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              🍽️ Controle de Alimentação
            </h2>
            <div className="visual-controls">
              <button className={`visual-btn ${visualMode === 'grid' ? 'active' : ''}`} onClick={() => setVisualMode('grid')}>
                📦 Grade
              </button>
              <button className={`visual-btn ${visualMode === 'list' ? 'active' : ''}`} onClick={() => setVisualMode('list')}>
                📋 Lista
              </button>
            </div>
          </div> */}
              <div className="farm-map-content">
                {visualMode === 'grid' ? (
                  <div className="aqua-viveiros-grid">
                    {dashboard.viveiros.map((viveiro: any) => {
                      const racaoHoje = viveiro.racoes ? viveiro.racoes.find((r: any) => normalizeDate(r.data) === normalizeDate(new Date())) : null;
                      const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                      const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                      const status = alimentouManha && alimentouTarde ? 'completo' : (alimentouManha || alimentouTarde) ? 'parcial' : 'pendente';
                      
                      // calcular métricas de ração
                      const recomendado = viveiro.recomendadoTotal ?? viveiro.racaoMeta ?? 0;
                      const fornecidoHoje = racaoHoje ? ((racaoHoje.qntManha||0) + (racaoHoje.qntTarde||0)) : 0;
                      const restante = Math.max(0, (recomendado - fornecidoHoje));
                      const progresso = recomendado > 0 ? Math.round((fornecidoHoje / recomendado) * 100) : 0;

                      return (
                        <div
                          key={viveiro.viveiro?.id || viveiro.id}
                          className={`aqua-viveiro-card ${selectedViveiro?.viveiro?.id === (viveiro.viveiro?.id || viveiro.id) || activeViveiro?.viveiro?.id === (viveiro.viveiro?.id || viveiro.id) ? 'selected' : ''}`}
                          onClick={() => setActiveViveiro(viveiro)}
                        >
                          {/* Card Header */}
                          <div className="aqua-card-header">
                            <h3 className="aqua-viveiro-name">
                              {viveiro.viveiro?.nome || viveiro.nome}
                            </h3>
                            <span className="aqua-viveiro-doc">DOC {viveiro.doc}</span>
                          </div>

                          {/* Status Badge */}
                          <div className={`aqua-status-badge ${status}`}>
                            <span className="aqua-status-icon"></span>
                            {status === 'completo' ? 'Completo' : status === 'parcial' ? 'Parcial' : 'Pendente'}
                          </div>

                          {/* Main Feed Info */}
                          <div className="aqua-feed-main">
                            <div className="aqua-feed-label">Ração de hoje</div>
                            <div className="aqua-feed-amount">{fornecidoHoje.toFixed(1)} kg</div>
                            <div className="aqua-feed-recommended">Recomendado: {recomendado ? `${recomendado.toFixed(1)} kg` : '—'}</div>
                          </div>

                          {/* Progress Bar */}
                          <div className="aqua-progress-container">
                            <div className="aqua-progress-bar">
                              <div 
                                className="aqua-progress-fill" 
                                style={{ 
                                  width: `${Math.min(progresso, 100)}%`,
                                  background: progresso >= 100 ? 
                                    'linear-gradient(90deg, var(--success-green), #059669)' : 
                                    'linear-gradient(90deg, var(--aqua-primary), var(--aqua-secondary))'
                                }}
                              />
                            </div>
                            <div className="aqua-progress-text">
                              <span className="aqua-progress-label">Alimentação do dia</span>
                              <span className="aqua-progress-percentage">{progresso}%</span>
                            </div>
                          </div>

                          {/* Secondary Info */}
                          <div className="aqua-secondary-info">
                            <div className="aqua-biomassa">
                              <span className="aqua-biomassa-label">Biomassa</span>
                              <span className="aqua-biomassa-value">
                                {viveiro.biomassa?.toFixed ? viveiro.biomassa.toFixed(0) : '-'} kg
                              </span>
                            </div>
                            <div className="aqua-remaining">
                              <span className="aqua-remaining-label">Racao Restante: </span>
                              <span className="aqua-remaining-value">{restante.toFixed(1)} kg</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="aqua-card-actions">
                            <button
                              className="aqua-btn aqua-btn-secondary"
                              onClick={e => {
                                e.stopPropagation();
                                window.location.href = `/viveiro/${viveiro.viveiro?.id || viveiro.id}/racao`;
                              }}
                            >
                              📋 Ver Detalhes
                            </button>
                            <button
                              className="aqua-btn aqua-btn-success"
                              onClick={e => {
                                e.stopPropagation();
                                const racaoHoje = viveiro.racoes ? viveiro.racoes.find((r: any) => normalizeDate(r.data) === normalizeDate(new Date())) : null;
                                setModalViveiro(viveiro);
                                setModalRacaoHoje(racaoHoje || null);
                                setModalManha(racaoHoje?.qntManha ? Number(racaoHoje.qntManha.toFixed ? racaoHoje.qntManha.toFixed(1) : racaoHoje.qntManha) : 0);
                                setModalTarde(racaoHoje?.qntTarde ? Number(racaoHoje.qntTarde.toFixed ? racaoHoje.qntTarde.toFixed(1) : racaoHoje.qntTarde) : 0);
                                setModalOpen(true);
                              }}
                            >
                              ➕ Registrar Ração
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="aqua-viveiros-list" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    margin: 'var(--space-4) 0'
                  }}>
                    {dashboard.viveiros.map((viveiro: any) => {
                      const racaoHoje = viveiro.racoes ? viveiro.racoes.find((r: any) => normalizeDate(r.data) === normalizeDate(new Date())) : null;
                      const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                      const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                      const status = alimentouManha && alimentouTarde ? 'completo' : (alimentouManha || alimentouTarde) ? 'parcial' : 'pendente';
                      const fornecidoHoje = racaoHoje ? ((racaoHoje.qntManha||0) + (racaoHoje.qntTarde||0)) : 0;
                      
                      return (
                        <div 
                          key={viveiro.viveiro?.id || viveiro.id}
                          className={`aqua-viveiro-card ${selectedViveiro?.viveiro?.id === (viveiro.viveiro?.id || viveiro.id) || activeViveiro?.viveiro?.id === (viveiro.viveiro?.id || viveiro.id) ? 'selected' : ''}`}
                          style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
                          onClick={() => setActiveViveiro(viveiro)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <span className={`aqua-status-icon ${status}`} style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: status === 'completo' ? 'var(--success-green)' : status === 'parcial' ? 'var(--warning-amber)' : 'var(--danger-red)'
                              }} />
                              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {viveiro.viveiro?.nome || viveiro.nome}
                              </h3>
                              <span className="aqua-viveiro-doc">DOC {viveiro.doc}</span>
                            </div>
                            <div className={`aqua-status-badge ${status}`} style={{ margin: 0 }}>
                              {status === 'completo' ? '✓' : status === 'parcial' ? '⏳' : '⏰'} {status}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Ração hoje</div>
                              <div style={{ fontSize: 'var(--font-xl)', fontWeight: '700', color: 'var(--aqua-primary)' }}>
                                {fornecidoHoje.toFixed(1)} kg
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Biomassa</div>
                              <div style={{ fontSize: 'var(--font-base)', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {viveiro.biomassa?.toFixed ? viveiro.biomassa.toFixed(0) : '-'} kg
                              </div>
                            </div>
                            <button
                              className="aqua-btn aqua-btn-primary"
                              onClick={e => {
                                e.stopPropagation();
                                window.location.href = `/viveiro/${viveiro.viveiro?.id || viveiro.id}/racao`;
                              }}
                            >
                              📋 Ver Detalhes
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
            )}
          </div>
        </div>

        {/* Painel lateral do viveiro (quando selecionado) */}
        {/* <ViveiroPanel viveiro={activeViveiro} onClose={() => setActiveViveiro(null)} /> */}
        {/* Modal rápido para registrar ração por viveiro */}
        <AquaModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setModalViveiro(null); setModalManha(0); setModalTarde(0); }}
          onSave={handleConfirmRegister}
          title={modalViveiro ? `Registrar ração — ${modalViveiro.viveiro?.nome || modalViveiro?.nome}` : 'Registrar ração'}
          saveButtonText={submitting ? 'Registrando...' : 'Confirmar'}
          size="md"
        >
          <div className="aqua-feed-section">
            {/* <div className="aqua-feed-section-title">
              🍤 Distribuição da Ração
            </div> */}
            
            <div className="aqua-feed-periods">
              <div className="aqua-feed-period">
                <div className="aqua-feed-period-label">Manhã</div>
                <div className="aqua-feed-input-group">
                  <div className="aqua-feed-quick-add">
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', -0.5)}>-0.5</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', -1)}>-1</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', -2)}>-2</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', -5)}>-5</button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={modalManha}
                    onChange={e => setModalManha(Number(e.target.value))}
                    className="aqua-feed-input"
                  />
                  <button className="aqua-zero-btn" onClick={() => setModalManha(0)}>X</button>
                  <div className="aqua-feed-quick-add">
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', 0.5)}>+0.5</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', 1)}>+1</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', 2)}>+2</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('manha', 5)}>+5</button>
                  </div>
                </div>
              </div>
              
              <div className="aqua-feed-period">
                <div className="aqua-feed-period-label">Tarde</div>
                <div className="aqua-feed-input-group">
                  <div className="aqua-feed-quick-add">
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', -0.5)}>-0.5</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', -1)}>-1</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', -2)}>-2</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', -5)}>-5</button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={modalTarde}
                    onChange={e => setModalTarde(Number(e.target.value))}
                    className="aqua-feed-input"
                  />
                  <button className="aqua-zero-btn" onClick={() => setModalTarde(0)}>X</button>
                  <div className="aqua-feed-quick-add">
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', 0.5)}>+0.5</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', 1)}>+1</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', 2)}>+2</button>
                    <button className="aqua-quick-btn" onClick={() => handleQuickAdd('tarde', 5)}>+5</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="aqua-feed-total">
              <div className="aqua-feed-total-label">Total do dia</div>
              <div className="aqua-feed-total-value">{(modalManha + modalTarde).toFixed(1)} kg</div>
            </div>
          </div>
        </AquaModal>

        {/* Modal para preencher dias faltantes */}
        <AquaModal
          isOpen={fillMissingModal}
          onClose={() => { setFillMissingModal(false); setMissingDaysData([]); }}
          onSave={handleConfirmFillMissing}
          title="Preencher Dias Faltantes"
          saveButtonText={fillingSubmitting ? 'Preenchendo...' : 'Confirmar Preenchimento'}
          size="lg"
        >
          <div className="fill-missing-days-modal">
            {missingDaysData.length === 0 ? (
              <div className="no-missing-days">
                <div className="no-missing-icon">✅</div>
                <div className="no-missing-title">Todos os dias estão preenchidos!</div>
                <div className="no-missing-subtitle">Não foram encontrados dias sem registro nos últimos 7 dias.</div>
              </div>
            ) : (
              <div className="missing-days-content">
                <div className="missing-days-summary">
                  <p>Foram encontrados <strong>{missingDaysData.reduce((acc, v) => acc + v.missingDays.length, 0)}</strong> dias sem registro em <strong>{missingDaysData.length}</strong> viveiros.</p>
                  <p>Os valores sugeridos são baseados na meta diária de cada viveiro.</p>
                </div>
                
                {missingDaysData.map((viveiroData, viveiroIndex) => (
                  <div key={viveiroData.viveiroId} className="viveiro-missing-section">
                    <h4 className="viveiro-missing-title">{viveiroData.viveiro}</h4>
                    <div className="missing-days-table">
                      <div className="table-header">
                        <div>Data</div>
                        <div>Manhã (kg)</div>
                        <div>Tarde (kg)</div>
                        <div>Total (kg)</div>
                      </div>
                      {viveiroData.missingDays.map((dayData: any, dayIndex: number) => (
                        <div key={dayData.date} className="table-row">
                          <div className="date-cell">{dayData.dateFormatted}</div>
                          <div className="input-cell">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={dayData.recommendedManha}
                              onChange={(e) => updateRecommendedValue(viveiroIndex, dayIndex, 'manha', e.target.value)}
                              className="aqua-small-input"
                            />
                          </div>
                          <div className="input-cell">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={dayData.recommendedTarde}
                              onChange={(e) => updateRecommendedValue(viveiroIndex, dayIndex, 'tarde', e.target.value)}
                              className="aqua-small-input"
                            />
                          </div>
                          <div className="total-cell">{dayData.totalRecommended}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AquaModal>
      </div>

      {/* EVENTOS DA FAZENDA */}
      {/* <div className="events-section">
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
              {Object.keys(eventosPorDia).map(day => (
                <div key={day} className="events-day-group">
                  <div className="events-day-header">{day}</div>
                  {eventosPorDia[day].map((evento: any) => (
                    <div key={evento.id} className={`event-item ${evento.tipo}`}>
                      <div className="event-icon">
                        {evento.tipo === 'alimentacao' ? '🍤' : evento.tipo === 'alerta' ? '⚠️' : '✅'}
                      </div>
                      <div className="event-content">
                        <div className="event-time">{evento.horario}</div>
                        <div className="event-message">{evento.mensagem}</div>
                        {evento.detalhes && <div className="event-details">{evento.detalhes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
}

export default FazendaRacao;
