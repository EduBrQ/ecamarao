import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, Wheat, Scale, TrendingUp, Sunrise, Sunset, ChevronRight, Download } from 'lucide-react'
import { Card, StatTile, Badge, Table, Button, Spinner, Alert, EmptyState, type BadgeTone } from '@edubrq/design-system'
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

function feedStatus(v: ViveiroDashboard): { label: string; tone: BadgeTone } {
  if (v.alimentouManha && v.alimentouTarde) return { label: 'Completo', tone: 'success' }
  if (v.alimentouManha || v.alimentouTarde) return { label: 'Parcial', tone: 'warning' }
  return { label: 'Pendente', tone: 'danger' }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando dados da fazenda...</Card></div>
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }
  if (!dashboard) {
    return <div className="page fade-in"><EmptyState title="Nenhum dado disponível" /></div>
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ração da fazenda</h1>
          <p className="page-subtitle">Visão geral e controle de todos os viveiros</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} /> Exportar
        </Button>
      </div>

      <div className="stat-grid">
        <StatTile className="stat-tile-accent" label={<><Sprout size={12} style={{ verticalAlign: 'text-bottom' }} /> Viveiros ativos</>} value={dashboard.totais.totalViveiros} />
        <StatTile className="stat-tile-accent" label={<><Wheat size={12} style={{ verticalAlign: 'text-bottom' }} /> Ração hoje</>} value={dashboard.totais.totalRacaoHoje.toFixed(1)} unit="kg" />
        <StatTile className="stat-tile-accent" label={<><Scale size={12} style={{ verticalAlign: 'text-bottom' }} /> Biomassa total</>} value={dashboard.totais.totalBiomassa.toFixed(0)} unit="kg" />
        <StatTile className="stat-tile-accent" label={<><TrendingUp size={12} style={{ verticalAlign: 'text-bottom' }} /> FCR médio</>} value={dashboard.totais.fcrMedio > 0 ? dashboard.totais.fcrMedio.toFixed(2) : '-'} />
      </div>

      <div className="card-row" style={{ gap: 'var(--space-2)' }}>
        <Badge tone="success">{dashboard.totais.viveirosAlimentados} completos</Badge>
        <Badge tone="warning">{dashboard.totais.viveirosParciais} parciais</Badge>
        <Badge tone="danger">{dashboard.totais.viveirosPendentes} pendentes</Badge>
      </div>

      <div className="nav-list">
        {dashboard.viveiros.map((v) => {
          const status = feedStatus(v)
          return (
            <Card key={v.viveiro.id}>
              <div className="card-row">
                <div>
                  <strong>{v.viveiro.nome}</strong>
                  <span className="page-subtitle" style={{ marginLeft: 'var(--space-2)' }}>DOC {v.doc} &middot; {v.fase}</span>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              <div className="stat-grid">
                <StatTile label="Ração hoje" value={`${v.racaoHojeTotal.toFixed(1)}/${v.recomendadoTotal.toFixed(1)}`} unit="kg" />
                <StatTile label="Biomassa" value={v.biomassa.toFixed(0)} unit="kg" />
                <StatTile label="FCR" value={v.fcrAtual > 0 ? v.fcrAtual.toFixed(2) : '-'} />
              </div>

              <div className="card-row" style={{ gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" onClick={() => handleAlimentacaoRapida(v.viveiro.id, 'manha')} disabled={v.alimentouManha}>
                  <Sunrise size={14} /> Manhã
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleAlimentacaoRapida(v.viveiro.id, 'tarde')} disabled={v.alimentouTarde}>
                  <Sunset size={14} /> Tarde
                </Button>
                <Button variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => navigate(`/viveiro/${v.viveiro.id}/racao`)}>
                  Detalhes <ChevronRight size={14} />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h3 className="section-title">Resumo detalhado</h3>
        <div className="table-wrapper">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Th>Viveiro</Table.Th><Table.Th>DOC</Table.Th><Table.Th>Fase</Table.Th><Table.Th className="num">Ração hoje</Table.Th>
                <Table.Th className="num">Recomendado</Table.Th><Table.Th className="num">Biomassa</Table.Th><Table.Th className="num">FCR</Table.Th><Table.Th>Status</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {dashboard.viveiros.map((v) => (
                <Table.Row key={v.viveiro.id}>
                  <Table.Td><strong>{v.viveiro.nome}</strong></Table.Td>
                  <Table.Td>{v.doc}</Table.Td>
                  <Table.Td>{v.fase}</Table.Td>
                  <Table.Td className="num">{v.racaoHojeTotal.toFixed(1)} kg</Table.Td>
                  <Table.Td className="num">{v.recomendadoTotal.toFixed(1)} kg</Table.Td>
                  <Table.Td className="num">{v.biomassa.toFixed(0)} kg</Table.Td>
                  <Table.Td className="num">{v.fcrAtual > 0 ? v.fcrAtual.toFixed(2) : '-'}</Table.Td>
                  <Table.Td><Badge tone={feedStatus(v).tone}>{feedStatus(v).label}</Badge></Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>
    </div>
  )
}

export default FazendaRacao
