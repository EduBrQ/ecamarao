import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, Wheat, Scale, TrendingUp, Sunrise, Sunset, ChevronRight, Download, Loader2 } from 'lucide-react'
import { backendApi, getErrorMessage } from '../services/backendApi'
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
  recomendadoTotal: number
  fase: string
  fcrAtual: number
  biomassa: number
  alimentouManha: boolean
  alimentouTarde: boolean
}

interface TotaisFazenda {
  totalViveiros: number
  totalRacaoHoje: number
  totalBiomassa: number
  fcrMedio: number
  viveirosAlimentados: number
  viveirosParciais: number
  viveirosPendentes: number
}

interface DashboardResponse {
  viveiros: ViveiroDashboard[]
  totais: TotaisFazenda
}

function feedStatus(v: ViveiroDashboard): { label: string; variant: string } {
  if (v.alimentouManha && v.alimentouTarde) return { label: 'Completo', variant: 'pill-good' }
  if (v.alimentouManha || v.alimentouTarde) return { label: 'Parcial', variant: 'pill-warning' }
  return { label: 'Pendente', variant: 'pill-critical' }
}

function FazendaRacao() {
  const navigate = useNavigate()
  const toast = useToastGlobal()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        setDashboard(await backendApi.getDashboardFazenda())
      } catch (err) {
        console.error('Erro ao carregar dashboard da fazenda:', err)
        toast.error('Erro ao carregar dados', getErrorMessage(err, 'Não foi possível carregar o dashboard da fazenda'))
        setError('Erro ao carregar dados da fazenda')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [toast])

  const handleExport = () => {
    if (!dashboard) return
    const rows = [
      ['Viveiro', 'DOC', 'Fase', 'Ração Hoje (kg)', 'Recomendado (kg)', 'Biomassa (kg)', 'FCR', 'Status'],
      ...dashboard.viveiros.map((v) => [
        v.viveiro.nome, v.doc, v.fase, v.racaoHojeTotal.toFixed(1), v.recomendadoTotal.toFixed(1),
        v.biomassa.toFixed(0), v.fcrAtual > 0 ? v.fcrAtual.toFixed(2) : '-', feedStatus(v).label,
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `fazenda_racao_${new Date().toLocaleDateString('pt-BR')}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAlimentacaoRapida = async (viveiroId: number, periodo: 'manha' | 'tarde') => {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      const quantidade = 5.0
      await backendApi.createColetaRacao(viveiroId.toString(), {
        data: hoje,
        qnt_manha: periodo === 'manha' ? quantidade : 0,
        qnt_tarde: periodo === 'tarde' ? quantidade : 0,
      })
      setDashboard(await backendApi.getDashboardFazenda())
    } catch (err) {
      toast.error('Erro ao registrar alimentação', getErrorMessage(err, 'Não foi possível registrar. Tente novamente.'))
    }
  }

  if (loading) {
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando dados da fazenda...</div></div>
  }
  if (error) {
    return <div className="page fade-in"><div className="card text-center field-error">{error}</div></div>
  }
  if (!dashboard) {
    return <div className="page fade-in"><div className="card text-center">Nenhum dado disponível</div></div>
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ração da fazenda</h1>
          <p className="page-subtitle">Visão geral e controle de todos os viveiros</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={16} /> Exportar
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-tile stat-tile-accent">
          <span className="stat-value">{dashboard.totais.totalViveiros}</span>
          <span className="stat-label"><Sprout size={12} style={{ verticalAlign: 'text-bottom' }} /> Viveiros ativos</span>
        </div>
        <div className="stat-tile stat-tile-accent">
          <span className="stat-value">{dashboard.totais.totalRacaoHoje.toFixed(1)}<span className="stat-unit">kg</span></span>
          <span className="stat-label"><Wheat size={12} style={{ verticalAlign: 'text-bottom' }} /> Ração hoje</span>
        </div>
        <div className="stat-tile stat-tile-accent">
          <span className="stat-value">{dashboard.totais.totalBiomassa.toFixed(0)}<span className="stat-unit">kg</span></span>
          <span className="stat-label"><Scale size={12} style={{ verticalAlign: 'text-bottom' }} /> Biomassa total</span>
        </div>
        <div className="stat-tile stat-tile-accent">
          <span className="stat-value">{dashboard.totais.fcrMedio > 0 ? dashboard.totais.fcrMedio.toFixed(2) : '-'}</span>
          <span className="stat-label"><TrendingUp size={12} style={{ verticalAlign: 'text-bottom' }} /> FCR médio</span>
        </div>
      </div>

      <div className="card-row" style={{ gap: 'var(--space-2)' }}>
        <span className="pill pill-good">{dashboard.totais.viveirosAlimentados} completos</span>
        <span className="pill pill-warning">{dashboard.totais.viveirosParciais} parciais</span>
        <span className="pill pill-critical">{dashboard.totais.viveirosPendentes} pendentes</span>
      </div>

      <div className="nav-list">
        {dashboard.viveiros.map((v) => {
          const status = feedStatus(v)
          return (
            <div key={v.viveiro.id} className="card">
              <div className="card-row">
                <div>
                  <strong>{v.viveiro.nome}</strong>
                  <span className="page-subtitle" style={{ marginLeft: 'var(--space-2)' }}>DOC {v.doc} &middot; {v.fase}</span>
                </div>
                <span className={`pill ${status.variant}`}>{status.label}</span>
              </div>

              <div className="stat-grid">
                <div className="stat-tile">
                  <span className="stat-value">{v.racaoHojeTotal.toFixed(1)}/{v.recomendadoTotal.toFixed(1)}<span className="stat-unit">kg</span></span>
                  <span className="stat-label">Ração hoje</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-value">{v.biomassa.toFixed(0)}<span className="stat-unit">kg</span></span>
                  <span className="stat-label">Biomassa</span>
                </div>
                <div className="stat-tile">
                  <span className="stat-value">{v.fcrAtual > 0 ? v.fcrAtual.toFixed(2) : '-'}</span>
                  <span className="stat-label">FCR</span>
                </div>
              </div>

              <div className="card-row" style={{ gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAlimentacaoRapida(v.viveiro.id, 'manha')} disabled={v.alimentouManha}>
                  <Sunrise size={14} /> Manhã
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAlimentacaoRapida(v.viveiro.id, 'tarde')} disabled={v.alimentouTarde}>
                  <Sunset size={14} /> Tarde
                </button>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate(`/viveiro/${v.viveiro.id}/racao`)}>
                  Detalhes <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h3 className="section-title">Resumo detalhado</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Viveiro</th><th>DOC</th><th>Fase</th><th className="num">Ração hoje</th>
                <th className="num">Recomendado</th><th className="num">Biomassa</th><th className="num">FCR</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.viveiros.map((v) => (
                <tr key={v.viveiro.id}>
                  <td><strong>{v.viveiro.nome}</strong></td>
                  <td>{v.doc}</td>
                  <td>{v.fase}</td>
                  <td className="num">{v.racaoHojeTotal.toFixed(1)} kg</td>
                  <td className="num">{v.recomendadoTotal.toFixed(1)} kg</td>
                  <td className="num">{v.biomassa.toFixed(0)} kg</td>
                  <td className="num">{v.fcrAtual > 0 ? v.fcrAtual.toFixed(2) : '-'}</td>
                  <td><span className={`pill ${feedStatus(v).variant}`}>{feedStatus(v).label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FazendaRacao
