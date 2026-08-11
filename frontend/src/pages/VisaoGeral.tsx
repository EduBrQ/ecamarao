import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Droplets } from 'lucide-react'
import { Card, StatTile, Alert, EmptyState, Spinner } from '@edubrq/design-system'
import {
  calcularDOC,
  calcularSobrevivencia,
  calcularRacaoDiariaAvancada,
  calcularFCR,
  gerarAlertas,
  RANGES_IDEAIS,
  ParametroAgua,
} from '../models/types'
import { backendApi, Viveiro, ColetaRacao, Medicao, RegistroMortalidade } from '../services/backendApi'

const FASES = [
  { doc: 0, nome: 'Sem ciclo' },
  { doc: 15, nome: 'Berçário' },
  { doc: 45, nome: 'Fase Inicial' },
  { doc: 75, nome: 'Crescimento' },
  { doc: 100, nome: 'Engorda' },
  { doc: 120, nome: 'Despesca' },
]

function getFaseAtual(doc: number): { nome: string; descricao: string } {
  if (doc === 0) return { nome: 'Sem ciclo', descricao: 'Nenhum ciclo iniciado' }
  if (doc <= 15) return { nome: 'Berçário', descricao: 'Aclimatação e adaptação. Alimentação leve.' }
  if (doc <= 45) return { nome: 'Fase Inicial', descricao: 'Crescimento rápido. Monitorar qualidade da água.' }
  if (doc <= 75) return { nome: 'Crescimento', descricao: 'Ganho de peso acelerado. Ajustar ração.' }
  if (doc <= 100) return { nome: 'Engorda', descricao: 'Fase final. Maximizar conversão alimentar.' }
  return { nome: 'Despesca', descricao: 'Pronto para colheita. Avaliar peso e mercado.' }
}

function statTileVariant(kind: 'fcr' | 'sobrevivencia', value: number): string {
  if (kind === 'fcr') {
    if (value <= 0) return ''
    if (value <= 1.5) return 'stat-tile-good'
    if (value <= 2.0) return 'stat-tile-warning'
    return 'stat-tile-critical'
  }
  if (value >= 80) return 'stat-tile-good'
  if (value >= 60) return 'stat-tile-warning'
  return 'stat-tile-critical'
}

function VisaoGeral() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [racao, setRacao] = useState<ColetaRacao[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAllData = async () => {
      if (!viveiroId) return
      try {
        setLoading(true)
        setError(null)
        const [viveiroData, racaoData, medicoesData, mortalidadeData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getColetasRacao(viveiroId),
          backendApi.getMedicoes(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId),
        ])
        setViveiro(viveiroData)
        setRacao(racaoData)
        setMedicoes(medicoesData)
        setMortalidade(mortalidadeData)
      } catch (err) {
        console.error('Erro ao carregar visão geral:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [viveiroId])

  if (loading) {
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando...</Card></div>
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><EmptyState title="Viveiro não encontrado" /></div>
  }

  const doc = calcularDOC(viveiro.data_inicio_ciclo)
  const densidade = viveiro.densidade ?? 0
  const area = viveiro.area ?? 0
  const populacaoInicial = densidade * area
  const mortalidadeTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const vivos = populacaoInicial - mortalidadeTotal
  const sobrevivencia = calcularSobrevivencia(densidade, area, mortalidadeTotal)
  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  // Biomassa estimada via peso previsto pela curva de crescimento (DOC), não
  // um peso fixo — a biomassa real cresce ao longo do ciclo.
  const recomendacao = calcularRacaoDiariaAvancada(densidade, area, doc, mortalidade, undefined, undefined)
  const biomassa = recomendacao.biomassaEstimadaKg
  const fcr = calcularFCR(racaoTotal, biomassa)

  const diasParaDespesca = doc > 0 ? Math.max(0, 100 - doc) : 0
  const dataColheitaEstimada = viveiro.data_inicio_ciclo
    ? new Date(new Date(viveiro.data_inicio_ciclo + 'T00:00:00').getTime() + 100 * 24 * 60 * 60 * 1000)
    : null
  const fase = getFaseAtual(doc)

  const ultimaMedicao = medicoes.length > 0 ? medicoes[medicoes.length - 1] : null
  const alertas = ultimaMedicao ? gerarAlertas(ultimaMedicao) : []

  const recomendacoes: string[] = []
  if (doc === 0) recomendacoes.push('Defina a data de início do ciclo para começar o acompanhamento.')
  if (doc > 0 && doc <= 15) recomendacoes.push('Fase de berçário: mantenha alimentação leve (2-3% da biomassa/dia) e monitore oxigênio e pH constantemente.')
  if (doc > 15 && doc <= 45) recomendacoes.push('Fase inicial: aumente gradualmente a ração (3-4% da biomassa/dia) e meça a qualidade da água diariamente.')
  if (doc > 45 && doc <= 75) recomendacoes.push('Crescimento: ração em 4-5% da biomassa/dia, ajustando conforme ganho de peso. Mantenha aeradores ligados.')
  if (doc > 75 && doc <= 100) recomendacoes.push('Engorda: reduza para 3-4% da biomassa/dia, monitore o FCR semanalmente e prepare a despesca.')
  if (doc > 100) recomendacoes.push('Pronto para despesca: avalie peso médio e condições de mercado.')
  if (sobrevivencia < 60 && doc > 0) recomendacoes.push(`Atenção: sobrevivência baixa (${sobrevivencia.toFixed(1)}%) — investigue as causas da mortalidade.`)
  if (fcr > 2.0 && racaoTotal > 0) recomendacoes.push(`FCR elevado (${fcr.toFixed(2)}): revise a estratégia alimentar e a qualidade da água.`)

  return (
    <div className="page fade-in">
      <Card>
        <div className="page-header">
          <div>
            <h2 className="section-title">{fase.nome}</h2>
            <p className="page-subtitle">{fase.descricao}</p>
          </div>
          <StatTile className="stat-tile-accent" style={{ minWidth: 64 }} label="DOC" value={doc} />
        </div>
        {dataColheitaEstimada && (
          <div className="stat-grid">
            <StatTile label="Início" value={new Date(viveiro.data_inicio_ciclo).toLocaleDateString('pt-BR')} />
            <StatTile label="Despesca est." value={dataColheitaEstimada.toLocaleDateString('pt-BR')} />
            <StatTile label="Dias restantes" value={diasParaDespesca} />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="section-title">Indicadores</h3>
        <div className="stat-grid">
          <StatTile className={statTileVariant('sobrevivencia', sobrevivencia)} label="Sobrevivência" value={sobrevivencia.toFixed(1)} unit="%" />
          <StatTile className={statTileVariant('fcr', fcr)} label="FCR" value={fcr > 0 ? fcr.toFixed(2) : '-'} />
          <StatTile label="Biomassa est." value={biomassa > 0 ? biomassa.toFixed(0) : '-'} unit="kg" />
          <StatTile label="Vivos" value={vivos.toLocaleString('pt-BR')} />
          <StatTile label="Ração total" value={racaoTotal.toFixed(1)} unit="kg" />
          <StatTile label="Dias alimentados" value={racao.length} />
        </div>
      </Card>

      <Card>
        <h3 className="section-title">Fases do ciclo</h3>
        <div className="phase-timeline">
          {FASES.map((f, i) => {
            const prevDoc = i > 0 ? FASES[i - 1].doc : 0
            const status = doc >= f.doc ? 'done' : doc >= prevDoc ? 'current' : 'pending'
            return (
              <div key={f.nome} className={`phase-step ${status}`}>
                <span className="phase-dot" />
                <span className="phase-name">{f.nome}</span>
                <span className="phase-doc">DOC {f.doc}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {recomendacoes.length > 0 && (
        <Card>
          <h3 className="section-title">Recomendações</h3>
          <div className="alert-list">
            {recomendacoes.map((texto, i) => (
              <Alert key={i} tone="warning" icon={<AlertTriangle size={16} />}>{texto}</Alert>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="section-title"><Droplets size={16} /> Qualidade da água (última medição)</h3>
        {ultimaMedicao ? (
          <div className="stat-grid">
            {(['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade'] as ParametroAgua[]).map((param) => {
              const range = RANGES_IDEAIS[param]
              const valor = ultimaMedicao[param] as number
              if (valor === undefined || valor === null) return null
              const isOk = valor >= range.min && valor <= range.max
              return (
                <StatTile key={param} className={isOk ? 'stat-tile-good' : 'stat-tile-critical'} label={range.label} value={valor} unit={range.unit} />
              )
            })}
          </div>
        ) : (
          <EmptyState title="Nenhuma medição registrada. Acesse &quot;Qualidade da Água&quot; para inserir dados." />
        )}

        {alertas.length > 0 && (
          <div className="alert-list">
            {alertas.map((alerta, i) => (
              <Alert
                key={i}
                tone={alerta.condicao.startsWith('critico') ? 'danger' : 'warning'}
                icon={<AlertTriangle size={16} />}
                title={alerta.mensagem}
              >
                {alerta.manejo}
              </Alert>
            ))}
          </div>
        )}

        {alertas.length === 0 && ultimaMedicao && (
          <Alert tone="success" icon={<CheckCircle2 size={20} />}>
            Todos os parâmetros dentro da faixa ideal
          </Alert>
        )}
      </Card>
    </div>
  )
}

export default VisaoGeral
