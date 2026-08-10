import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Droplets, Loader2 } from 'lucide-react'
import {
  calcularDOC,
  calcularBiomassa,
  calcularSobrevivencia,
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
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando...</div></div>
  }
  if (error) {
    return <div className="page fade-in"><div className="card text-center field-error">{error}</div></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><div className="card text-center">Viveiro não encontrado</div></div>
  }

  const doc = calcularDOC(viveiro.data_inicio_ciclo)
  const densidade = viveiro.densidade ?? 0
  const populacaoInicial = densidade * 1000
  const mortalidadeTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const vivos = populacaoInicial - mortalidadeTotal
  const sobrevivencia = calcularSobrevivencia(densidade, mortalidadeTotal)
  const pesoMedio = 0 // Peso médio não está disponível no backend ainda
  const biomassa = calcularBiomassa(densidade, mortalidadeTotal, pesoMedio)
  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
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
      <div className="card">
        <div className="page-header">
          <div>
            <h2 className="section-title">{fase.nome}</h2>
            <p className="page-subtitle">{fase.descricao}</p>
          </div>
          <div className="stat-tile stat-tile-accent" style={{ minWidth: 64 }}>
            <span className="stat-value">{doc}</span>
            <span className="stat-label">DOC</span>
          </div>
        </div>
        {dataColheitaEstimada && (
          <div className="stat-grid">
            <div className="stat-tile">
              <span className="stat-value">{new Date(viveiro.data_inicio_ciclo).toLocaleDateString('pt-BR')}</span>
              <span className="stat-label">Início</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">{dataColheitaEstimada.toLocaleDateString('pt-BR')}</span>
              <span className="stat-label">Despesca est.</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">{diasParaDespesca}</span>
              <span className="stat-label">Dias restantes</span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Indicadores</h3>
        <div className="stat-grid">
          <div className={`stat-tile ${statTileVariant('sobrevivencia', sobrevivencia)}`}>
            <span className="stat-value">{sobrevivencia.toFixed(1)}<span className="stat-unit">%</span></span>
            <span className="stat-label">Sobrevivência</span>
          </div>
          <div className={`stat-tile ${statTileVariant('fcr', fcr)}`}>
            <span className="stat-value">{fcr > 0 ? fcr.toFixed(2) : '-'}</span>
            <span className="stat-label">FCR</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{biomassa > 0 ? biomassa.toFixed(0) : '-'}<span className="stat-unit">kg</span></span>
            <span className="stat-label">Biomassa est.</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{vivos.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Vivos</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{racaoTotal.toFixed(1)}<span className="stat-unit">kg</span></span>
            <span className="stat-label">Ração total</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{racao.length}</span>
            <span className="stat-label">Dias alimentados</span>
          </div>
        </div>
      </div>

      <div className="card">
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
      </div>

      {recomendacoes.length > 0 && (
        <div className="card">
          <h3 className="section-title">Recomendações</h3>
          <div className="alert-list">
            {recomendacoes.map((texto, i) => (
              <div key={i} className="alert alert-warning">
                <AlertTriangle className="alert-icon" size={16} />
                <div className="alert-body"><span>{texto}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title"><Droplets size={16} /> Qualidade da água (última medição)</h3>
        {ultimaMedicao ? (
          <div className="stat-grid">
            {(['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade'] as ParametroAgua[]).map((param) => {
              const range = RANGES_IDEAIS[param]
              const valor = ultimaMedicao[param] as number
              if (valor === undefined || valor === null) return null
              const isOk = valor >= range.min && valor <= range.max
              return (
                <div key={param} className={`stat-tile ${isOk ? 'stat-tile-good' : 'stat-tile-critical'}`}>
                  <span className="stat-value">{valor}<span className="stat-unit">{range.unit}</span></span>
                  <span className="stat-label">{range.label}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">Nenhuma medição registrada. Acesse "Qualidade da Água" para inserir dados.</div>
        )}

        {alertas.length > 0 && (
          <div className="alert-list">
            {alertas.map((alerta, i) => (
              <div key={i} className={`alert ${alerta.condicao.startsWith('critico') ? 'alert-critical' : 'alert-warning'}`}>
                <AlertTriangle className="alert-icon" size={16} />
                <div className="alert-body">
                  <strong>{alerta.mensagem}</strong>
                  <span>{alerta.manejo}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {alertas.length === 0 && ultimaMedicao && (
          <div className="empty-state success">
            <CheckCircle2 size={20} />
            Todos os parâmetros dentro da faixa ideal
          </div>
        )}
      </div>
    </div>
  )
}

export default VisaoGeral
