import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApi } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'

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
    <div className="container fade-in">
      {/* Cabeçalho com informações gerais */}
      <div className="card">
        <div className="card-header-accent">
          📊 Dashboard da Fazenda
          <button 
            className="export-button" 
            onClick={() => handleExportFazenda()}
            style={{ marginLeft: 'auto' }}
          >
            📊 Exportar Dados
          </button>
        </div>
        
        <div className="fazenda-summary">
          <div className="fazenda-main">
            <span className="fazenda-value">{dashboard.totais.totalViveiros}</span>
            <span className="fazenda-label">Viveiros Ativos</span>
          </div>
          <div className="fazenda-details">
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{dashboard.totais.totalRacaoHoje.toFixed(1)} kg</span>
              <span className="fazenda-detail-label">Ração Hoje</span>
            </div>
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{dashboard.totais.totalRecomendado.toFixed(1)} kg</span>
              <span className="fazenda-detail-label">Recomendado</span>
            </div>
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{dashboard.totais.totalBiomassa.toFixed(0)} kg</span>
              <span className="fazenda-detail-label">Biomassa Total</span>
            </div>
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{dashboard.totais.fcrMedio > 0 ? dashboard.totais.fcrMedio.toFixed(2) : '-'}</span>
              <span className="fazenda-detail-label">FCR Médio</span>
            </div>
          </div>
        </div>

        {/* Indicadores de status */}
        <div className="fazenda-status-grid">
          <div className="fazenda-status-card complete">
            <span className="fazenda-status-value">{dashboard.totais.viveirosAlimentados}</span>
            <span className="fazenda-status-label">Alimentação Completa</span>
          </div>
          <div className="fazenda-status-card partial">
            <span className="fazenda-status-value">{dashboard.totais.viveirosParciais}</span>
            <span className="fazenda-status-label">Alimentação Parcial</span>
          </div>
          <div className="fazenda-status-card pending">
            <span className="fazenda-status-value">{dashboard.totais.viveirosPendentes}</span>
            <span className="fazenda-status-label">Alimentação Pendente</span>
          </div>
        </div>
      </div>

      {/* Cards dos viveiros */}
      <div className="card">
        <h3 className="card-title">Controle Rápido por Viveiro</h3>
        <div className="fazenda-viveiros-grid">
          {dashboard.viveiros.map((viveiro) => (
            <div key={viveiro.viveiro.id} className="fazenda-viveiro-card">
              <div className="fazenda-viveiro-header">
                <h4>{viveiro.viveiro.nome}</h4>
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

              <div className="fazenda-viveiro-details">
                <div className="fazenda-detail">
                  <span className="fazenda-detail-label">Fase:</span>
                  <span className="fazenda-detail-value">{viveiro.fase}</span>
                </div>
                <div className="fazenda-detail">
                  <span className="fazenda-detail-label">Biomassa:</span>
                  <span className="fazenda-detail-value">{viveiro.biomassa.toFixed(0)} kg</span>
                </div>
                <div className="fazenda-detail">
                  <span className="fazenda-detail-label">FCR:</span>
                  <span className="fazenda-detail-value">{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</span>
                </div>
              </div>

              {/* Botões de ação rápida */}
              <div className="fazenda-viveiro-actions">
                <button 
                  className="fazenda-action-btn manha"
                  onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'manha')}
                  disabled={viveiro.alimentouManha}
                >
                  🌅 Alimentar Manhã
                </button>
                <button 
                  className="fazenda-action-btn tarde"
                  onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'tarde')}
                  disabled={viveiro.alimentouTarde}
                >
                  🌆 Alimentar Tarde
                </button>
                <button 
                  className="fazenda-action-btn details"
                  onClick={() => navigate(`/racao/${viveiro.viveiro.id}`)}
                >
                  📋 Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela resumo */}
      <div className="card">
        <h3 className="card-title">Resumo Detalhado</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Viveiro</th>
                <th>DOC</th>
                <th>Fase</th>
                <th className="text-right">Hoje</th>
                <th className="text-right">Recomendado</th>
                <th className="text-right">Biomassa</th>
                <th className="text-right">FCR</th>
                <th>Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.viveiros.map((viveiro) => (
                <tr key={viveiro.viveiro.id}>
                  <td>
                    <button 
                      className="btn-link" 
                      onClick={() => navigate(`/racao/${viveiro.viveiro.id}`)}
                    >
                      {viveiro.viveiro.nome}
                    </button>
                  </td>
                  <td>{viveiro.doc}</td>
                  <td>{viveiro.fase}</td>
                  <td className="text-right">{viveiro.racaoHojeTotal.toFixed(1)} kg</td>
                  <td className="text-right">{viveiro.recomendadoTotal.toFixed(1)} kg</td>
                  <td className="text-right">{viveiro.biomassa.toFixed(0)} kg</td>
                  <td className="text-right">{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</td>
                  <td>
                    <span className={`status-badge ${viveiro.alimentouManha && viveiro.alimentouTarde ? 'complete' : viveiro.alimentouManha ? 'partial' : 'pending'}`}>
                      {viveiro.alimentouManha && viveiro.alimentouTarde ? 'Completo' : viveiro.alimentouManha ? 'Parcial' : 'Pendente'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="table-actions">
                      <button 
                        className="table-action-btn"
                        onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'manha')}
                        disabled={viveiro.alimentouManha}
                        title="Alimentar Manhã"
                      >
                        🌅
                      </button>
                      <button 
                        className="table-action-btn"
                        onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'tarde')}
                        disabled={viveiro.alimentouTarde}
                        title="Alimentar Tarde"
                      >
                        🌆
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rodapé com última atualização */}
      <div className="card-footer">
        <small className="text-muted">
          Última atualização: {new Date(dashboard.atualizado).toLocaleString('pt-BR')}
        </small>
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
