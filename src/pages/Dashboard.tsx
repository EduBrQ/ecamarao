import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ViveiroDTO,
  ColetaRacao,
  Medicao,
  RegistroMortalidade,
  calcularDOC,
  calcularBiomassa,
  calcularSobrevivencia,
  calcularFCR,
  gerarAlertas,
  RANGES_IDEAIS,
  ParametroAgua,
} from '../models/types'

function Dashboard() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [viveiro, setViveiro] = useState<ViveiroDTO | null>(null)
  const [racao, setRacao] = useState<ColetaRacao[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])

  useEffect(() => {
    const storedViveiro = localStorage.getItem('viveiro')
    if (storedViveiro) setViveiro(JSON.parse(storedViveiro))

    const storedRacao = localStorage.getItem(`racao_${viveiroId}`)
    if (storedRacao) setRacao(JSON.parse(storedRacao))

    const storedMedicoes = localStorage.getItem(`medicoes_${viveiroId}`)
    if (storedMedicoes) setMedicoes(JSON.parse(storedMedicoes))

    const storedMort = localStorage.getItem(`mortalidade_${viveiroId}`)
    if (storedMort) setMortalidade(JSON.parse(storedMort))
  }, [viveiroId])

  if (!viveiro) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando...</div>
      </div>
    )
  }

  const doc = calcularDOC(viveiro.dataInicioCiclo)
  const densidade = viveiro.densidade ?? 0
  const mortalidadeTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const sobrevivencia = calcularSobrevivencia(densidade, mortalidadeTotal)
  const pesoMedio = viveiro.pesoMedioAtual ?? 0
  const biomassa = calcularBiomassa(densidade, mortalidadeTotal, pesoMedio)
  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const fcr = calcularFCR(racaoTotal, biomassa)
  const custoRacao = racaoTotal * (viveiro.precoRacaoKg ?? 3)
  const custoKg = biomassa > 0 ? custoRacao / biomassa : 0

  // SGR = (ln(Wt) - ln(W0)) / t * 100
  // Estimated W0 = 0.01g (post-larva), Wt = pesoMedio
  const sgr = doc > 0 && pesoMedio > 0.01
    ? ((Math.log(pesoMedio) - Math.log(0.01)) / doc) * 100
    : 0

  // Last measurement alerts
  const ultimaMedicao = medicoes.length > 0 ? medicoes[medicoes.length - 1] : null
  const alertas = ultimaMedicao ? gerarAlertas(ultimaMedicao) : []

  function getKpiStatus(label: string, value: number): 'good' | 'warning' | 'critical' {
    if (label === 'fcr') {
      if (value <= 0) return 'good'
      if (value <= 1.5) return 'good'
      if (value <= 2.0) return 'warning'
      return 'critical'
    }
    if (label === 'sobrevivencia') {
      if (value >= 80) return 'good'
      if (value >= 60) return 'warning'
      return 'critical'
    }
    return 'good'
  }

  const kpis = [
    {
      label: 'Dias de Cultivo',
      value: doc.toString(),
      unit: 'DOC',
      status: 'good' as const,
    },
    {
      label: 'Sobrevivencia',
      value: sobrevivencia.toFixed(1),
      unit: '%',
      status: getKpiStatus('sobrevivencia', sobrevivencia),
    },
    {
      label: 'FCR',
      value: fcr > 0 ? fcr.toFixed(2) : '-',
      unit: '',
      status: getKpiStatus('fcr', fcr),
    },
    {
      label: 'Biomassa Est.',
      value: biomassa > 0 ? biomassa.toFixed(0) : '-',
      unit: 'kg',
      status: 'good' as const,
    },
    {
      label: 'SGR',
      value: sgr > 0 ? sgr.toFixed(2) : '-',
      unit: '%/dia',
      status: 'good' as const,
    },
    {
      label: 'Custo/Kg',
      value: custoKg > 0 ? `R$ ${custoKg.toFixed(2)}` : '-',
      unit: '',
      status: 'good' as const,
    },
  ]

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Dashboard - Viveiro {viveiroId}</div>

        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`kpi-card kpi-${kpi.status}`}>
              <div className="kpi-value">
                {kpi.value}
                {kpi.unit && <span className="kpi-unit"> {kpi.unit}</span>}
              </div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Water Quality Summary */}
      {ultimaMedicao && (
        <div className="card">
          <h3 className="card-title">Qualidade da Agua (Ultima Medicao)</h3>
          <div className="water-params-grid">
            {(['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade'] as ParametroAgua[]).map((param) => {
              const range = RANGES_IDEAIS[param]
              const valor = ultimaMedicao[param] as number
              if (valor === undefined || valor === null) return null
              const isOk = valor >= range.min && valor <= range.max
              return (
                <div key={param} className={`water-param ${isOk ? 'water-ok' : 'water-alert'}`}>
                  <span className="water-param-value">{valor}{range.unit}</span>
                  <span className="water-param-label">{range.label}</span>
                  <span className="water-param-range">{range.min}-{range.max}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alertas.length > 0 && (
        <div className="card">
          <h3 className="card-title">Alertas Ativos</h3>
          <div className="alert-list">
            {alertas.map((alerta, i) => (
              <div key={i} className={`alert-item alert-${alerta.condicao.startsWith('critico') ? 'critical' : 'warning'}`}>
                <div className="alert-msg">{alerta.mensagem}</div>
                <div className="alert-manejo">{alerta.manejo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertas.length === 0 && ultimaMedicao && (
        <div className="card">
          <div className="empty-state success-state">
            Todos os parametros dentro da faixa ideal
          </div>
        </div>
      )}

      {!ultimaMedicao && (
        <div className="card">
          <div className="empty-state">
            Nenhuma medicao registrada. Acesse "Qualidade da Agua" para inserir dados.
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
