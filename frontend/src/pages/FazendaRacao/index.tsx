import { useState, useEffect } from 'react';
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

// function ViveiroPanel({ viveiro, onClose }: { viveiro: any; onClose: () => void }) {
//   if (!viveiro) return (
//     <div className="aqua-side-panel empty">
//       <div className="panel-empty">Selecione um viveiro no mapa</div>
//     </div>
//   );

//   const racaoHoje = viveiro.racoes ? viveiro.racoes.find((r: any) => normalizeDate(r.data) === normalizeDate(new Date())) : null;
//   const consumo = viveiro.consumoUltimosDias || [1,2,3,4,5,6];
//   const maxConsumo = Math.max(...consumo);

//   return (
//     <div className="aqua-side-panel">
//       <div className="aqua-panel-header">
//         <h3 className="aqua-panel-title">VIVEIRO {viveiro.viveiro?.nome || viveiro.nome}</h3>
//         <button className="aqua-panel-close" onClick={onClose}>✖</button>
//       </div>
//       <div className="aqua-panel-body">
//         <div className="aqua-panel-section">
//           <div className="aqua-panel-section-title">Status do Viveiro</div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">Saúde</span>
//             <span className="aqua-panel-metric-value">{viveiro.saude ?? '—'} / 100</span>
//           </div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">Biomassa</span>
//             <span className="aqua-panel-metric-value">{viveiro.biomassa?.toFixed ? viveiro.biomassa.toFixed(0) : '-'} kg</span>
//           </div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">DOC</span>
//             <span className="aqua-panel-metric-value">{viveiro.doc}</span>
//           </div>
//         </div>

//         <div className="aqua-panel-section">
//           <div className="aqua-panel-section-title">Alimentação Hoje</div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">Fornecido</span>
//             <span className="aqua-panel-metric-value">
//               {racaoHoje ? `${(racaoHoje.qntManha||0)+(racaoHoje.qntTarde||0)} kg` : '—'}
//             </span>
//           </div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">Recomendado</span>
//             <span className="aqua-panel-metric-value">{viveiro.racaoMeta || '-'} kg</span>
//           </div>
//         </div>

//         <div className="aqua-panel-section">
//           <div className="aqua-panel-section-title">Consumo Últimos Dias</div>
//           <div className="aqua-sparkline">
//             {consumo.map((c: any, i: number) => (
//               <div 
//                 key={i} 
//                 className="aqua-sparkline-bar" 
//                 style={{ height: `${(c / maxConsumo) * 100}%` }}
//                 title={`Dia ${i + 1}: ${c} kg`}
//               />
//             ))}
//           </div>
//         </div>

//         <div className="aqua-panel-section">
//           <div className="aqua-panel-section-title">Produção</div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">Previsão</span>
//             <span className="aqua-panel-metric-value">{viveiro.previsaoProducao ?? '-'} t</span>
//           </div>
//         </div>

//         <div className="aqua-panel-section">
//           <div className="aqua-panel-section-title">Alertas</div>
//           <div className="aqua-panel-metric">
//             <span className="aqua-panel-metric-label">
//               {(viveiro.alertas && viveiro.alertas.length) ? viveiro.alertas.join(', ') : 'Nenhum'}
//             </span>
//           </div>
//         </div>

//         <button 
//           className="aqua-btn aqua-btn-primary" 
//           onClick={() => window.location.href = `/viveiro/${viveiro.viveiro?.id || viveiro.id}/racao`}
//           style={{ width: '100%', marginTop: 'auto' }}
//         >
//           Ver Detalhes Completos
//         </button>
//       </div>
//     </div>
//   );
// }


/**
 * Componente principal do Dashboard AquaFarm
 * Refatorado para melhor organização e manutenibilidade
 */
function FazendaRacao() {
  const { dashboard, loading, error, totalRacaoHoje, refetchData } = useDashboardData();
  const toast = useToastGlobal();
  const { selectedViveiro } = usePondSelection();
  const [visualMode] = useState<VisualMode>('grid');
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
  
  // Estados para modal de novo viveiro
  const [novoViveiroModal, setNovoViveiroModal] = useState(false);
  const [novoViveiro, setNovoViveiro] = useState({
    nome: '',
    densidade: 0,
    area: 0,
    data_inicio_ciclo: new Date().toISOString().split('T')[0]
  });

  // Estados para modal de exclusão
  const [deleteModal, setDeleteModal] = useState(false);
  const [viveiroToDelete, setViveiroToDelete] = useState<any>(null);

  // Estado para tema
  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Default para dark mode se não houver preferência salva
    const isDark = savedTheme === 'light' ? false : true;
    
    // Aplicar classe imediatamente para evitar flash
    if (isDark) {
      document.body.classList.add('dark-mode');
    }
    
    return isDark;
  });

  // Efeito para aplicar tema ao body
  useEffect(() => {
    console.log('useEffect called, isDarkMode:', isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      console.log('Applied dark mode');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      console.log('Applied light mode');
    }
  }, [isDarkMode]);

  // Função para alternar tema
  // const toggleTheme = () => {
  //   console.log('Toggle theme clicked, current isDarkMode:', isDarkMode);
  //   setIsDarkMode(!isDarkMode);
  // };

  // Função para criar novo viveiro
  const handleCriarViveiro = async () => {
    try {
      setSubmitting(true);
      
      // Validar campos
      if (!novoViveiro.nome.trim()) {
        toast.error('Nome do viveiro é obrigatório');
        return;
      }
      
      if (novoViveiro.densidade <= 0) {
        toast.error('Densidade deve ser maior que 0');
        return;
      }
      
      if (novoViveiro.area <= 0) {
        toast.error('Área deve ser maior que 0');
        return;
      }
      
      if (!novoViveiro.data_inicio_ciclo) {
        toast.error('Data de início do ciclo é obrigatória');
        return;
      }
      
      // Chamar API para criar viveiro
      await backendApi.createViveiro({
        nome: novoViveiro.nome.trim(),
        densidade: novoViveiro.densidade,
        area: novoViveiro.area,
        data_inicio_ciclo: novoViveiro.data_inicio_ciclo
      });
      
      toast.success('Viveiro criado com sucesso!');
      setNovoViveiroModal(false);
      setNovoViveiro({
        nome: '',
        densidade: 0,
        area: 0,
        data_inicio_ciclo: new Date().toISOString().split('T')[0]
      });
      
      // Recarregar dados do dashboard
      refetchData();
      
    } catch (error) {
      console.error('Erro ao criar viveiro:', error);
      toast.error('Erro ao criar viveiro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Função para abrir modal de exclusão
  const handleDeleteClick = (viveiro: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Impedir que o clique se propague para o card
    setViveiroToDelete(viveiro);
    setDeleteModal(true);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!viveiroToDelete) return;
    
    try {
      const viveiroId = viveiroToDelete.viveiro?.id || viveiroToDelete.id;
      await backendApi.deleteViveiro(viveiroId);
      toast.success('Viveiro excluído com sucesso!');
      setDeleteModal(false);
      setViveiroToDelete(null);
      refetchData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao excluir viveiro:', error);
      toast.error('Erro ao excluir viveiro. Tente novamente.');
    }
  };

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

  // Função para calcular dias faltantes
  const getMissingDaysInfo = () => {
    if (!dashboard) return { totalMissing: 0, viveirosWithMissing: 0 };
    
    let totalMissing = 0;
    let viveirosWithMissing = 0;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Final do dia

    dashboard.viveiros.forEach((viveiro: any) => {
      let missingCount = 0;
      
      // Usar a data de início do ciclo de cada viveiro
      const startDate = viveiro.viveiro?.data_inicio_ciclo ? new Date(viveiro.viveiro.data_inicio_ciclo) : new Date();
      startDate.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
      
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const racaoDia = viveiro.racoes?.find((r: any) => normalizeDate(r.data) === normalizeDate(currentDate));
        
        // Considerar como faltante apenas se não existir registro OU se ambos os valores forem 0
        if (!racaoDia || (racaoDia.qntManha === 0 && racaoDia.qntTarde === 0)) {
          // Não contar dias futuros
          if (currentDate <= new Date()) {
            missingCount++;
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (missingCount > 0) {
        totalMissing += missingCount;
        viveirosWithMissing++;
      }
    });

    return { totalMissing, viveirosWithMissing };
  };

  // Função para analisar dias sem registro
  const handleFillMissingDays = () => {
    if (!dashboard) return;
    
    const missingData: any[] = [];
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Final do dia

    dashboard.viveiros.forEach((viveiro: any) => {
      const missingDays: any[] = [];
      
      // Usar a data de início do ciclo de cada viveiro
      const startDate = viveiro.viveiro?.data_inicio_ciclo ? new Date(viveiro.viveiro.data_inicio_ciclo) : new Date();
      startDate.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
      
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const racaoDia = viveiro.racoes?.find((r: any) => normalizeDate(r.data) === normalizeDate(currentDate));
        
        // Considerar como faltante apenas se não existir registro OU se ambos os valores forem 0
        if (!racaoDia || (racaoDia.qntManha === 0 && racaoDia.qntTarde === 0)) {
          // Não contar dias futuros
          if (currentDate <= new Date()) {
            const recommendedManha = Number((viveiro.recomendadoManha / 2).toFixed(1));
            const recommendedTarde = Number((viveiro.recomendadoTarde / 2).toFixed(1));
            
            missingDays.push({
              date: new Date(currentDate),
              dateFormatted: currentDate.toLocaleDateString('pt-BR'),
              recommendedManha,
              recommendedTarde,
              totalRecommended: (recommendedManha + recommendedTarde).toFixed(1)
            });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (missingDays.length > 0) {
        missingData.push({
          viveiroId: viveiro.viveiro.id,
          viveiro: viveiro.viveiro.nome,
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
        <button className="aqua-button aqua-button-primary" onClick={handleExportPDF}>Relatório geral </button>
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
            {/* <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                alignSelf: 'flex-start'
              }}
              title={isDarkMode ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button> */}
          </div>
        </div>
      </header>

      {/* Alerta de Dias Faltantes */}
      {(() => {
        const { totalMissing, viveirosWithMissing } = getMissingDaysInfo();
        if (totalMissing === 0) return null;
        
        return (
          <div className="missing-days-alert" onClick={handleFillMissingDays}>
            <div className="missing-days-icon">⚠️</div>
            <div className="missing-days-content">
              <div className="missing-days-title">
                {viveirosWithMissing} viveiro{viveirosWithMissing > 1 ? 's' : ''} com pendências de ração
              </div>
              <div className="missing-days-subtitle">
                Total de {totalMissing} registro{totalMissing > 1 ? 's' : ''} pendente{totalMissing > 1 ? 's' : ''}
              </div>
            </div>
            <div className="missing-days-action">
              <button className="aqua-btn aqua-btn-small aqua-btn-warning">
                Preencher Agora
              </button>
            </div>
          </div>
        );
      })()}

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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                              <h3 className="aqua-viveiro-name">
                                {viveiro.viveiro?.nome || viveiro.nome}
                              </h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <span className="aqua-viveiro-doc">DOC {viveiro.doc}</span>
                              <button
                                className="delete-viveiro-btn"
                                onClick={(e) => handleDeleteClick(viveiro, e)}
                                style={{
                                  background: 'var(--danger-red-light)',
                                  color: 'var(--danger-red)',
                                  padding: 'var(--space-1) var(--space-2)',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: 'var(--font-sm)',
                                  fontWeight: '600',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  minWidth: '24px',
                                  height: '24px'
                                }}
                                title="Excluir viveiro"
                              >
                                ×
                              </button>
                            </div>
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

                                        {/* Card para adicionar novo viveiro */}
                    <div 
                      className="aqua-viveiro-card"
                      style={{ 
                        padding: 'var(--space-4)', 
                        cursor: 'pointer',
                        border: '2px dashed var(--border)',
                        backgroundColor: 'var(--bg-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setNovoViveiroModal(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 'var(--space-3)'
                      }}>
                        <span style={{ 
                          fontSize: '24px', 
                          color: 'white',
                          lineHeight: 1 
                        }}>+</span>
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-lg)', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        textAlign: 'center' 
                      }}>
                        Adicionar Viveiro
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-sm)', 
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        marginTop: 'var(--space-1)' 
                      }}>
                        Clique para criar um novo viveiro
                      </div>
                    </div>
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

      {/* Modal para criar novo viveiro */}
      <AquaModal
        isOpen={novoViveiroModal}
        onClose={() => {
          setNovoViveiroModal(false);
          setNovoViveiro({
            nome: '',
            densidade: 0,
            area: 0,
            data_inicio_ciclo: new Date().toISOString().split('T')[0]
          });
        }}
        onSave={handleCriarViveiro}
        title="Criar Novo Viveiro"
        saveButtonText={submitting ? 'Criando...' : 'Criar Viveiro'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
              Nome do Viveiro
            </label>
            <input
              type="text"
              value={novoViveiro.nome}
              onChange={(e) => setNovoViveiro(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Viveiro Principal"
              style={{ 
                width: '100%', 
                padding: 'var(--space-2)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-base)'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                Densidade (x 1000)
              </label>
              <input
                type="number"
                value={novoViveiro.densidade || ''}
                onChange={(e) => setNovoViveiro(prev => ({ ...prev, densidade: Number(e.target.value) }))}
                placeholder="Ex: 100"
                min="1"
                style={{ 
                  width: '100%', 
                  padding: 'var(--space-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-base)'
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
                Área (m²)
              </label>
              <input
                type="number"
                value={novoViveiro.area || ''}
                onChange={(e) => setNovoViveiro(prev => ({ ...prev, area: Number(e.target.value) }))}
                placeholder="Ex: 2000"
                min="1"
                style={{ 
                  width: '100%', 
                  padding: 'var(--space-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-base)'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
              Data de Início do Ciclo
            </label>
            <input
              type="date"
              value={novoViveiro.data_inicio_ciclo}
              onChange={(e) => setNovoViveiro(prev => ({ ...prev, data_inicio_ciclo: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: 'var(--space-2)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-base)'
              }}
            />
          </div>
        </div>
      </AquaModal>

      {/* Modal de confirmação de exclusão */}
      <div id="delete-confirm-modal">
        <AquaModal
          isOpen={deleteModal}
          onClose={() => { setDeleteModal(false); setViveiroToDelete(null); }}
          onSave={handleConfirmDelete}
          title="Confirmar Exclusão"
          saveButtonText="Excluir"
        >
        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-3)' }}>⚠️</div>
          <p style={{ marginBottom: 'var(--space-2)', fontWeight: '600' }}>
            Tem certeza que deseja excluir este viveiro?
          </p>
          <p style={{ color: '#666', marginBottom: 'var(--space-4)' }}>
            <strong>{viveiroToDelete?.viveiro?.nome || viveiroToDelete?.nome}</strong>
          </p>
          <p style={{ color: '#dc3545', fontSize: '14px' }}>
            Esta ação não poderá ser desfeita.
          </p>
        </div>
      </AquaModal>
      </div>
    </div>
  );
}

export default FazendaRacao;
