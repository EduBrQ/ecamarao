import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApi } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'
import '../styles/FazendaDashboard.css'

interface ViveiroDashboard {
  viveiro: {
    id: number
    nome: string
    densidade: number
    area: number
    data_inicio_ciclo: string
    status: string
  }
  doc: number
  racaoHojeTotal: number
  racaoHojeManha: number
  racaoHojeTarde: number
  recomendadoTotal: number
  recomendadoManha: number
  recomendadoTarde: number
  fase: string
  fcrAtual: number
  racaoAcumulada: number
  biomassa: number
  alimentouManha: boolean
  alimentouTarde: boolean
  pesoEstimadoG: number
  populacaoEstimada: number
  biomassaEstimadaKg: number
  usandoPesoReal: boolean
  racoes: Array<{
    id: number
    data: string
    qntManha: number
    qntTarde: number
    total: number
  }>
}

interface TotaisFazenda {
  totalViveiros: number
  totalRacaoHoje: number
  totalRecomendado: number
  totalBiomassa: number
  totalRacaoAcumulada: number
  fcrMedio: number
  viveirosAlimentados: number
  viveirosParciais: number
  viveirosPendentes: number
}

interface DashboardResponse {
  viveiros: ViveiroDashboard[]
  totais: TotaisFazenda
  atualizado: string
}

// Função utilitária para normalizar datas
const normalizeDate = (date: string | Date): string => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return '';
};

function FazendaRacao() {
  const navigate = useNavigate()
  const toast = useToastGlobal()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para modais de quantidade
  const [quantidadeModal, setQuantidadeModal] = useState<{
    isOpen: boolean
    viveiroId: number
    periodo: 'manha' | 'tarde'
    quantidade: string
  }>({
    isOpen: false,
    viveiroId: 0,
    periodo: 'manha',
    quantidade: ''
  })

  // Estado para modal de status
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean
    tipo: 'completo' | 'parcial' | 'pendente'
    viveiros: Array<any>
  }>({
    isOpen: false,
    tipo: 'completo',
    viveiros: []
  })

  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const dashboardData = await backendApi.getDashboardFazenda()
        setDashboard(dashboardData)

      } catch (err: any) {
        console.error('Erro ao carregar dashboard da fazenda:', err)
        
        if (err.response?.data?.error) {
          toast.error('Erro ao carregar dados', err.response.data.error)
        } else {
          toast.error('Erro ao carregar dados', 'Não foi possível carregar o dashboard da fazenda')
        }
        
        setError('Erro ao carregar dados da fazenda')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [toast])

  // Função para exportar dados da fazenda
  const handleExportFazenda = () => {
    if (!dashboard) return

    try {
      const csvData = [
        ['Viveiro', 'DOC', 'Fase', 'Ração Hoje (kg)', 'Recomendado (kg)', 'Biomassa (kg)', 'FCR', 'Status Alimentação'],
        ...dashboard.viveiros.map(v => [
          v.viveiro.nome,
          v.doc,
          v.fase,
          v.racaoHojeTotal.toFixed(1),
          v.recomendadoTotal.toFixed(1),
          v.biomassa.toFixed(0),
          v.fcrAtual > 0 ? v.fcrAtual.toFixed(2) : '-',
          v.alimentouManha && v.alimentouTarde ? 'Completo' : v.alimentouManha ? 'Parcial' : 'Pendente'
        ])
      ]

      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `fazenda_racao_${new Date().toLocaleDateString('pt-BR')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error: any) {
      console.error('Erro ao exportar dados da fazenda:', error)
      
      if (error.response?.data?.error) {
        toast.error('Erro ao exportar', error.response.data.error)
      } else {
        toast.error('Erro ao exportar', 'Não foi possível exportar os dados. Tente novamente.')
      }
    }
  }

  // Função para registrar alimentação rápida
  const handleAlimentacaoRapida = async (viveiroId: number, periodo: 'manha' | 'tarde') => {
    // Abrir modal com quantidade pré-preenchida
    const viveiro = dashboard?.viveiros.find(v => v.viveiro.id === viveiroId)
    if (!viveiro) return
    
    // Usar valores recomendados do backend (já calculados com todos os dados)
    const quantidadeRecomendada = periodo === 'manha' 
      ? viveiro.recomendadoManha 
      : viveiro.recomendadoTarde
    
    setQuantidadeModal({
      isOpen: true,
      viveiroId,
      periodo,
      quantidade: quantidadeRecomendada.toString()
    })
  }

  const handleConfirmarQuantidade = async () => {
    const { viveiroId, periodo, quantidade } = quantidadeModal

    if (!quantidade || parseFloat(quantidade) <= 0) {
      toast.error('Quantidade inválida', 'Insira uma quantidade válida de ração')
      return
    }

    try {
      let quantidadeManha: number | undefined
      
      // Se for alimentação da tarde, buscar valor da manhã
      if (periodo === 'tarde') {
        try {
          const hoje = new Date().toISOString().split('T')[0]
          const racoesHoje = await backendApi.getColetasRacao(viveiroId.toString())
          const registroManha = racoesHoje.find((r: any) => r.data === hoje)
          
          if (registroManha && registroManha.qntManha) {
            quantidadeManha = registroManha.qntManha
          }
        } catch {
          // Silently continue if morning record not found
        }
      }
      
      await backendApi.registrarAlimentacao(viveiroId, periodo, parseFloat(quantidade), quantidadeManha)
      
      // Recarregar dashboard
      const dashboardData = await backendApi.getDashboardFazenda()
      setDashboard(dashboardData)
      
      toast.success(
        'Alimentação registrada', 
        `${periodo === 'manha' ? 'Manhã' : 'Tarde'}: ${quantidade} kg`
      )
      
      // Fechar modal
      setQuantidadeModal({
        isOpen: false,
        viveiroId: 0,
        periodo: 'manha',
        quantidade: ''
      })
    } catch (error) {
      console.error('Erro ao registrar alimentação:', error)
      toast.error('Erro', 'Não foi possível registrar a alimentação')
    }
  }

  const handleCancelarQuantidade = () => {
    setQuantidadeModal({
      isOpen: false,
      viveiroId: 0,
      periodo: 'manha',
      quantidade: ''
    })
  }

  // Funções para abrir modal de status
  const handleStatusClick = (tipo: 'completo' | 'parcial' | 'pendente') => {
    if (!dashboard) return;
    
    const hoje = new Date().toISOString().split('T')[0];
    const viveirosFiltrados = dashboard.viveiros.filter((viveiro: any) => {
      const racaoHoje = viveiro.racoes.find((r: any) => normalizeDate(r.data) === hoje);
      
      if (!racaoHoje) {
        return tipo === 'pendente';
      }
      
      const alimentouManha = racaoHoje.qntManha > 0;
      const alimentouTarde = racaoHoje.qntTarde > 0;
      
      switch (tipo) {
        case 'completo':
          return alimentouManha && alimentouTarde;
        case 'parcial':
          return (alimentouManha || alimentouTarde) && !(alimentouManha && alimentouTarde);
        case 'pendente':
          return !alimentouManha || !alimentouTarde; // Inclui parciais e não alimentados
        default:
          return false;
      }
    });
    
    setStatusModal({
      isOpen: true,
      tipo,
      viveiros: viveirosFiltrados
    });
  }

  const handleFecharStatusModal = () => {
    setStatusModal({
      isOpen: false,
      tipo: 'completo',
      viveiros: []
    });
  }

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando dados da fazenda...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container fade-in">
        <div className="card text-center text-red-600">{error}</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Nenhum dado disponível</div>
      </div>
    )
  }

  // Calcular totais usando dados do array racoes
  const hoje = new Date().toISOString().split('T')[0];
  let totalRacaoHoje = 0;
  let viveirosAlimentados = 0;
  let viveirosParciais = 0;
  let viveirosPendentes = 0;
  let totalFCR = 0;
  let viveirosComFCR = 0;

  dashboard.viveiros.forEach(viveiro => {
    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
    
    // Calcular ração hoje
    if (racaoHoje) {
      totalRacaoHoje += racaoHoje.total;
      
      const alimentouManha = racaoHoje.qntManha > 0;
      const alimentouTarde = racaoHoje.qntTarde > 0;
      
      if (alimentouManha && alimentouTarde) {
        viveirosAlimentados++;
      } else if (alimentouManha || alimentouTarde) {
        viveirosParciais++;
        viveirosPendentes++; // Parciais também são pendentes
      } else {
        viveirosPendentes++;
      }
    } else {
      viveirosPendentes++;
    }
    
    // Calcular FCR médio
    if (viveiro.fcrAtual > 0) {
      totalFCR += viveiro.fcrAtual;
      viveirosComFCR++;
    }
  });

  const fcrMedioCalculado = viveirosComFCR > 0 ? totalFCR / viveirosComFCR : 0;

  return (
    <div className="fazenda-dashboard-container">
      {/* Header Principal */}
      <div className="fazenda-header">
        <div className="fazenda-header-content">
          <div>
            <h1 className="fazenda-title">🦐 Dashboard da Fazenda</h1>
            <p className="fazenda-subtitle">Visão geral e controle de todos os viveiros</p>
          </div>
          <button 
            className="fazenda-export-btn" 
            onClick={() => handleExportFazenda()}
          >
            📊 Exportar Dados
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fazenda-kpi-grid">
        <div className="fazenda-kpi-card">
          <div className="fazenda-kpi-header">
            <span className="fazenda-kpi-title">Viveiros Ativos</span>
            <span className="fazenda-kpi-icon">🏠</span>
          </div>
          <div className="fazenda-kpi-value">{dashboard.totais.totalViveiros}</div>
          <span className="fazenda-kpi-change neutral">Total na fazenda</span>
        </div>
        
        <div className="fazenda-kpi-card">
          <div className="fazenda-kpi-header">
            <span className="fazenda-kpi-title">Ração Hoje</span>
            <span className="fazenda-kpi-icon">🌾</span>
          </div>
          <div className="fazenda-kpi-value">{totalRacaoHoje.toFixed(1)} kg</div>
          <span className="fazenda-kpi-change neutral">Alimentados hoje</span>
        </div>
        
        <div className="fazenda-kpi-card">
          <div className="fazenda-kpi-header">
            <span className="fazenda-kpi-title">Biomassa Total</span>
            <span className="fazenda-kpi-icon">⚖️</span>
          </div>
          <div className="fazenda-kpi-value">{dashboard.totais.totalBiomassa.toFixed(0)} kg</div>
          <span className="fazenda-kpi-change positive">Em crescimento</span>
        </div>
        
        <div className="fazenda-kpi-card">
          <div className="fazenda-kpi-header">
            <span className="fazenda-kpi-title">FCR Médio</span>
            <span className="fazenda-kpi-icon">📈</span>
          </div>
          <div className="fazenda-kpi-value">{fcrMedioCalculado > 0 ? fcrMedioCalculado.toFixed(2) : '-'}</div>
          <span className="fazenda-kpi-change neutral">Conversão alimentar</span>
        </div>
      </div>

      {/* Status de Alimentação */}
      <div className="fazenda-status-grid">
        <div className="fazenda-status-card" onClick={() => handleStatusClick('completo')} style={{ cursor: 'pointer' }}>
          <div className="fazenda-status-icon complete">✅</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Alimentação Completa</div>
            <div className="fazenda-status-value">{viveirosAlimentados}</div>
          </div>
        </div>
        
        <div className="fazenda-status-card" onClick={() => handleStatusClick('parcial')} style={{ cursor: 'pointer' }}>
          <div className="fazenda-status-icon partial">🌅</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Alimentação Parcial</div>
            <div className="fazenda-status-value">{viveirosParciais}</div>
          </div>
        </div>
        
        <div className="fazenda-status-card" onClick={() => handleStatusClick('pendente')} style={{ cursor: 'pointer' }}>
          <div className="fazenda-status-icon pending">⏳</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Pendentes</div>
            <div className="fazenda-status-value">{viveirosPendentes}</div>
          </div>
        </div>
      </div>

      {/* Cards dos Viveiros */}
      <div className="fazenda-viveiros-grid">
        {dashboard.viveiros.map((viveiro) => (
          <div key={viveiro.viveiro.id} className="fazenda-viveiro-card">
            <div className="fazenda-viveiro-header">
              <div className="fazenda-viveiro-title-row">
                <h3 className="fazenda-viveiro-name">{viveiro.viveiro.nome}</h3>
                <span className="fazenda-viveiro-doc">DOC {viveiro.doc}</span>
              </div>
              
              <div className="fazenda-viveiro-status">
                {(() => {
                  const hoje = new Date().toISOString().split('T')[0];
                  const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                  const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                  const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                  const racaoHojeTotal = racaoHoje ? racaoHoje.total : 0;
                  
                  return (
                    <>
                      <div className={`fazenda-feed-status ${alimentouManha && alimentouTarde ? 'complete' : alimentouManha ? 'partial' : 'pending'}`}>
                        {alimentouManha && alimentouTarde ? '✅ Completo' : alimentouManha ? '🌅 Parcial' : '⏳ Pendente'}
                      </div>
                      <div className="fazenda-feed-amount">
                        {racaoHojeTotal.toFixed(1)} / {viveiro.recomendadoTotal.toFixed(1)} kg
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="fazenda-viveiro-details">
              <div className="fazenda-detail">
                <span className="fazenda-detail-label">Fase</span>
                <span className="fazenda-detail-value">{viveiro.fase}</span>
              </div>
              <div className="fazenda-detail">
                <span className="fazenda-detail-label">Biomassa</span>
                <span className="fazenda-detail-value">{viveiro.biomassa.toFixed(0)} kg</span>
              </div>
              <div className="fazenda-detail">
                <span className="fazenda-detail-label">FCR</span>
                <span className="fazenda-detail-value">{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</span>
              </div>
            </div>

            <div className="fazenda-viveiro-actions">
              {(() => {
                const hoje = new Date().toISOString().split('T')[0];
                const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                
                return (
                  <>
                    <button 
                      className="fazenda-action-btn manha"
                      onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'manha')}
                      disabled={alimentouManha}
                    >
                      🌅 Manhã
                    </button>
                    <button 
                      className="fazenda-action-btn tarde"
                      onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'tarde')}
                      disabled={alimentouTarde}
                    >
                      🌆 Tarde
                    </button>
                  </>
                );
              })()}
              <button 
                className="fazenda-action-btn details"
                onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
              >
                📋 Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela Resumo */}
      <div className="fazenda-summary-section">
        <div className="fazenda-summary-header">
          <h2 className="fazenda-summary-title">📋 Resumo Detalhado</h2>
        </div>
        
        <table className="fazenda-summary-table">
          <thead>
            <tr>
              <th>Viveiro</th>
              <th>DOC</th>
              <th>Fase</th>
              <th>Ração Hoje</th>
              <th>Recomendado</th>
              <th>Biomassa</th>
              <th>FCR</th>
              <th>Histórico Ração</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.viveiros.map((viveiro) => (
              <tr key={viveiro.viveiro.id}>
                <td><strong>{viveiro.viveiro.nome}</strong></td>
                <td>{viveiro.doc}</td>
                <td>{viveiro.fase}</td>
                <td>
                  {(() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                    return racaoHoje ? `${racaoHoje.total.toFixed(1)} kg` : '0.0 kg';
                  })()}
                </td>
                <td>{viveiro.recomendadoTotal.toFixed(1)} kg</td>
                <td>{viveiro.biomassa.toFixed(0)} kg</td>
                <td>{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</td>
                <td>
                  <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {viveiro.racoes.slice(0, 3).map((racao) => (
                      <div key={racao.id} style={{ color: '#6b7280' }}>
                        {new Date(racao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: {racao.total.toFixed(1)}kg
                      </div>
                    ))}
                    {viveiro.racoes.length === 0 && (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sem registros</div>
                    )}
                    {viveiro.racoes.length > 3 && (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>+{viveiro.racoes.length - 3} mais...</div>
                    )}
                  </div>
                </td>
                <td>
                  {(() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                    if (!racaoHoje) {
                      return <span className="fazenda-feed-status pending">Pendente</span>;
                    }
                    const alimentouManha = racaoHoje.qntManha > 0;
                    const alimentouTarde = racaoHoje.qntTarde > 0;
                    return (
                      <span className={`fazenda-feed-status ${alimentouManha && alimentouTarde ? 'complete' : alimentouManha ? 'partial' : 'pending'}`}>
                        {alimentouManha && alimentouTarde ? 'Completo' : alimentouManha ? 'Parcial' : 'Pendente'}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  <div className="fazenda-table-actions">
                    <button 
                      className="fazenda-table-btn primary"
                      onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Quantidade de Ração */}
      {quantidadeModal.isOpen && (() => {
        const viveiro = dashboard?.viveiros.find(v => v.viveiro.id === quantidadeModal.viveiroId);
        const quantidadeRecomendada = quantidadeModal.periodo === 'manha' 
          ? viveiro?.recomendadoManha || 0 
          : viveiro?.recomendadoTarde || 0;
        
        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
            onClick={handleCancelarQuantidade}
          >
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                  {quantidadeModal.periodo === 'manha' ? '🌅' : '🌆'}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.5rem' }}>
                  Alimentação - {quantidadeModal.periodo === 'manha' ? 'Manhã' : 'Tarde'}
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: '#666', lineHeight: '1.5' }}>
                  Viveiro: <strong>{viveiro?.viveiro.nome}</strong>
                </p>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.25rem' }}>
                    Quantidade recomendada para {quantidadeModal.periodo === 'manha' ? 'manhã' : 'tarde'}:
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                    {quantidadeRecomendada} kg
                  </div>
                </div>
              </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Quantidade de Ração (kg):
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={quantidadeModal.quantidade}
                onChange={(e) => setQuantidadeModal({
                  ...quantidadeModal,
                  quantidade: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Ex: 2.5"
              />
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem' 
              }}>
                Recomendado: {quantidadeModal.periodo === 'manha' 
                  ? dashboard?.viveiros.find(v => v.viveiro.id === quantidadeModal.viveiroId)?.recomendadoManha.toFixed(1)
                  : dashboard?.viveiros.find(v => v.viveiro.id === quantidadeModal.viveiroId)?.recomendadoTarde.toFixed(1)
                } kg
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleCancelarQuantidade}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarQuantidade}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: quantidadeModal.periodo === 'manha' ? '#f59e0b' : '#8b5cf6',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = quantidadeModal.periodo === 'manha' ? '#d97706' : '#7c3aed'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = quantidadeModal.periodo === 'manha' ? '#f59e0b' : '#8b5cf6'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Confirmar Alimentação
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de Status */}
      {statusModal.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={handleFecharStatusModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {statusModal.tipo === 'completo' ? '✅' : statusModal.tipo === 'parcial' ? '🌅' : '⏳'}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.5rem' }}>
                {statusModal.tipo === 'completo' ? 'Alimentação Completa' : 
                 statusModal.tipo === 'parcial' ? 'Alimentação Parcial' : 'Pendentes'}
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: '#666', lineHeight: '1.5' }}>
                {statusModal.viveiros.length} viveiro(s) encontrado(s)
                {statusModal.tipo === 'pendente' && (
                  <span style={{ display: 'block', fontSize: '0.875rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Inclui viveiros parciais (que ainda precisam completar alimentação)
                  </span>
                )}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {statusModal.viveiros.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Nenhum viveiro encontrado neste status
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {statusModal.viveiros.map((viveiro) => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = viveiro.racoes.find((r: { data: string | Date }) => normalizeDate(r.data) === hoje);
                    
                    return (
                      <div 
                        key={viveiro.viveiro.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '1rem',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{viveiro.viveiro.nome}</strong>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '20px', 
                            fontSize: '0.875rem',
                            backgroundColor: statusModal.tipo === 'completo' ? '#dcfce7' : 
                                             statusModal.tipo === 'parcial' ? '#fef3c7' : '#fee2e2',
                            color: statusModal.tipo === 'completo' ? '#166534' : 
                                  statusModal.tipo === 'parcial' ? '#92400e' : '#991b1b'
                          }}>
                            DOC {viveiro.doc}
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <div>Fase: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.fase}</span></div>
                          <div>Biomassa: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.biomassa.toFixed(0)} kg</span></div>
                          <div>FCR: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</span></div>
                          <div>Recomendado: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.recomendadoTotal.toFixed(1)} kg</span></div>
                        </div>
                        
                        {racaoHoje && (
                          <div style={{ 
                            marginTop: '0.75rem', 
                            padding: '0.5rem', 
                            backgroundColor: 'white', 
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span>🌅 Manhã:</span>
                              <span style={{ fontWeight: '600', color: racaoHoje.qntManha > 0 ? '#059669' : '#9ca3af' }}>
                                {racaoHoje.qntManha.toFixed(1)} kg
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>🌆 Tarde:</span>
                              <span style={{ fontWeight: '600', color: racaoHoje.qntTarde > 0 ? '#059669' : '#9ca3af' }}>
                                {racaoHoje.qntTarde.toFixed(1)} kg
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                            style={{
                              padding: '0.5rem 1rem',
                              border: 'none',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleFecharStatusModal}
                style={{
                  padding: '0.75rem 2rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FazendaRacao

// Estilos para o dashboard da fazenda
const FazendaDashboardStyles = `
.fazenda-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.fazenda-status-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;
  transition: var(--transition);
}

.fazenda-status-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.fazenda-status-card.complete {
  border-left: 4px solid var(--success);
}

.fazenda-status-card.partial {
  border-left: 4px solid var(--warning);
}

.fazenda-status-card.pending {
  border-left: 4px solid var(--danger);
}

.fazenda-status-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.fazenda-status-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-light);
}

.fazenda-viveiro-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.fazenda-action-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: var(--transition);
}

.fazenda-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fazenda-action-btn.manha {
  background: var(--warning);
  color: white;
}

.fazenda-action-btn.tarde {
  background: var(--info);
  color: white;
}

.fazenda-action-btn.details {
  background: var(--primary);
  color: white;
}

.fazenda-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.table-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.table-action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
}

.table-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-footer {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
`

// Injetar estilos no documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = FazendaDashboardStyles
  document.head.appendChild(styleSheet)
}
