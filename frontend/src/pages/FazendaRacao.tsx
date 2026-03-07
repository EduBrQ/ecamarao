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

function FazendaRacao() {
  const navigate = useNavigate()
  const toast = useToastGlobal()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    try {
      const hoje = new Date().toISOString().split('T')[0]
      const quantidade = 5.0 // Quantidade padrão para alimentação rápida
      
      await backendApi.createColetaRacao(viveiroId.toString(), {
        data: hoje,
        qnt_manha: periodo === 'manha' ? quantidade : 0,
        qnt_tarde: periodo === 'tarde' ? quantidade : 0
      })

      // Recarregar dashboard
      const dashboardData = await backendApi.getDashboardFazenda()
      setDashboard(dashboardData)

    } catch (error: any) {
      console.error('Erro ao registrar alimentação rápida:', error)
      
      if (error.response?.data?.error) {
        toast.error('Erro ao registrar alimentação', error.response.data.error)
      } else if (error.response?.data?.details) {
        const errors = error.response.data.details;
        if (Array.isArray(errors) && errors.length > 0) {
          toast.error('Erro ao registrar alimentação', errors[0].message)
        } else {
          toast.error('Erro ao registrar alimentação', 'Dados inválidos')
        }
      } else {
        toast.error('Erro ao registrar alimentação', 'Não foi possível registrar. Tente novamente.')
      }
    }
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
          <div className="fazenda-kpi-value">{dashboard.totais.totalRacaoHoje.toFixed(1)} kg</div>
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
          <div className="fazenda-kpi-value">{dashboard.totais.fcrMedio > 0 ? dashboard.totais.fcrMedio.toFixed(2) : '-'}</div>
          <span className="fazenda-kpi-change neutral">Conversão alimentar</span>
        </div>
      </div>

      {/* Status de Alimentação */}
      <div className="fazenda-status-grid">
        <div className="fazenda-status-card">
          <div className="fazenda-status-icon complete">✅</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Alimentação Completa</div>
            <div className="fazenda-status-value">{dashboard.totais.viveirosAlimentados}</div>
          </div>
        </div>
        
        <div className="fazenda-status-card">
          <div className="fazenda-status-icon partial">🌅</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Alimentação Parcial</div>
            <div className="fazenda-status-value">{dashboard.totais.viveirosParciais}</div>
          </div>
        </div>
        
        <div className="fazenda-status-card">
          <div className="fazenda-status-icon pending">⏳</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Pendentes</div>
            <div className="fazenda-status-value">{dashboard.totais.viveirosPendentes}</div>
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
                <div className={`fazenda-feed-status ${viveiro.alimentouManha && viveiro.alimentouTarde ? 'complete' : viveiro.alimentouManha ? 'partial' : 'pending'}`}>
                  {viveiro.alimentouManha && viveiro.alimentouTarde ? '✅ Completo' : viveiro.alimentouManha ? '🌅 Parcial' : '⏳ Pendente'}
                </div>
                <div className="fazenda-feed-amount">
                  {viveiro.racaoHojeTotal.toFixed(1)} / {viveiro.recomendadoTotal.toFixed(1)} kg
                </div>
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
              <button 
                className="fazenda-action-btn manha"
                onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'manha')}
                disabled={viveiro.alimentouManha}
              >
                🌅 Manhã
              </button>
              <button 
                className="fazenda-action-btn tarde"
                onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'tarde')}
                disabled={viveiro.alimentouTarde}
              >
                🌆 Tarde
              </button>
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
                <td>{viveiro.racaoHojeTotal.toFixed(1)} kg</td>
                <td>{viveiro.recomendadoTotal.toFixed(1)} kg</td>
                <td>{viveiro.biomassa.toFixed(0)} kg</td>
                <td>{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</td>
                <td>
                  <span className={`fazenda-feed-status ${viveiro.alimentouManha && viveiro.alimentouTarde ? 'complete' : viveiro.alimentouManha ? 'partial' : 'pending'}`}>
                    {viveiro.alimentouManha && viveiro.alimentouTarde ? 'Completo' : viveiro.alimentouManha ? 'Parcial' : 'Pendente'}
                  </span>
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
  background: var(--surface);
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
