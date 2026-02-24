import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ViveiroDTO,
  RegistroMortalidade,
  ColetaRacao,
  calcularDOC,
  calcularBiomassa,
  calcularSobrevivencia,
  calcularFCR,
} from '../models/types'

function Ciclo() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [viveiro, setViveiro] = useState<ViveiroDTO | null>(null)
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [racao, setRacao] = useState<ColetaRacao[]>([])

  useEffect(() => {
    const storedViveiro = localStorage.getItem('viveiro')
    if (storedViveiro) setViveiro(JSON.parse(storedViveiro))
    const storedMort = localStorage.getItem(`mortalidade_${viveiroId}`)
    if (storedMort) setMortalidade(JSON.parse(storedMort))
    const storedRacao = localStorage.getItem(`racao_${viveiroId}`)
    if (storedRacao) setRacao(JSON.parse(storedRacao))
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
  const populacaoInicial = densidade * 1000
  const mortTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const sobrevivencia = calcularSobrevivencia(densidade, mortTotal)
  const pesoMedio = viveiro.pesoMedioAtual ?? 0
  const biomassa = calcularBiomassa(densidade, mortTotal, pesoMedio)
  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const fcr = calcularFCR(racaoTotal, biomassa)
  const vivos = populacaoInicial - mortTotal

  // Estimate harvest: typical cycle is 90-120 days for Vannamei
  const diasParaDespesca = doc > 0 ? Math.max(0, 100 - doc) : 0
  const dataColheitaEstimada = viveiro.dataInicioCiclo
    ? new Date(new Date(viveiro.dataInicioCiclo + 'T00:00:00').getTime() + 100 * 24 * 60 * 60 * 1000)
    : null

  // Growth phase
  function getFaseAtual(d: number): { nome: string; descricao: string; cor: string } {
    if (d === 0) return { nome: 'Sem ciclo', descricao: 'Nenhum ciclo iniciado', cor: 'var(--text-light)' }
    if (d <= 15) return { nome: 'Berçario', descricao: 'Aclimatacao e adaptacao. Alimentacao leve.', cor: 'var(--info)' }
    if (d <= 45) return { nome: 'Fase Inicial', descricao: 'Crescimento rapido. Monitorar qualidade da agua.', cor: 'var(--primary)' }
    if (d <= 75) return { nome: 'Crescimento', descricao: 'Ganho de peso acelerado. Ajustar racao.', cor: 'var(--success)' }
    if (d <= 100) return { nome: 'Engorda', descricao: 'Fase final. Maximizar conversao alimentar.', cor: 'var(--warning)' }
    return { nome: 'Despesca', descricao: 'Pronto para colheita. Avaliar peso e mercado.', cor: 'var(--danger)' }
  }

  const fase = getFaseAtual(doc)

  // Progress bar percentage (100 days = full cycle)
  const progressPct = Math.min(100, (doc / 100) * 100)

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Ciclo de Cultivo - Viveiro {viveiroId}</div>

        {/* Phase indicator */}
        <div className="cycle-phase" style={{ borderLeftColor: fase.cor }}>
          <div className="cycle-phase-header">
            <span className="cycle-phase-name" style={{ color: fase.cor }}>{fase.nome}</span>
            <span className="cycle-phase-doc">{doc} DOC</span>
          </div>
          <p className="cycle-phase-desc">{fase.descricao}</p>
        </div>

        {/* Progress bar */}
        <div className="cycle-progress">
          <div className="cycle-progress-bar">
            <div className="cycle-progress-fill" style={{ width: `${progressPct}%`, background: fase.cor }} />
          </div>
          <div className="cycle-progress-labels">
            <span>Povoamento</span>
            <span>Despesca (~100d)</span>
          </div>
        </div>
      </div>

      {/* Cycle Info Cards */}
      <div className="card">
        <h3 className="card-title">Dados do Ciclo</h3>
        <div className="cycle-info-grid">
          <div className="cycle-info-item">
            <span className="cycle-info-label">Data Povoamento</span>
            <span className="cycle-info-value">
              {viveiro.dataInicioCiclo
                ? new Date(viveiro.dataInicioCiclo + 'T00:00:00').toLocaleDateString('pt-BR')
                : '-'}
            </span>
          </div>
          <div className="cycle-info-item">
            <span className="cycle-info-label">Despesca Estimada</span>
            <span className="cycle-info-value">
              {dataColheitaEstimada ? dataColheitaEstimada.toLocaleDateString('pt-BR') : '-'}
            </span>
          </div>
          <div className="cycle-info-item">
            <span className="cycle-info-label">Dias Restantes</span>
            <span className="cycle-info-value">{diasParaDespesca > 0 ? `${diasParaDespesca} dias` : 'Pronto'}</span>
          </div>
          <div className="cycle-info-item">
            <span className="cycle-info-label">Laboratorio</span>
            <span className="cycle-info-value">{viveiro.laboratorio ?? '-'}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="card">
        <h3 className="card-title">Indicadores do Ciclo</h3>
        <div className="kpi-grid">
          <div className="kpi-card kpi-good">
            <div className="kpi-value">{populacaoInicial.toLocaleString('pt-BR')}</div>
            <div className="kpi-label">Pop. Inicial</div>
          </div>
          <div className={`kpi-card ${sobrevivencia >= 80 ? 'kpi-good' : sobrevivencia >= 60 ? 'kpi-warning' : 'kpi-critical'}`}>
            <div className="kpi-value">{sobrevivencia.toFixed(1)}%</div>
            <div className="kpi-label">Sobrevivencia</div>
          </div>
          <div className="kpi-card kpi-good">
            <div className="kpi-value">{vivos.toLocaleString('pt-BR')}</div>
            <div className="kpi-label">Vivos Est.</div>
          </div>
          <div className="kpi-card kpi-good">
            <div className="kpi-value">{biomassa > 0 ? `${biomassa.toFixed(0)} kg` : '-'}</div>
            <div className="kpi-label">Biomassa Est.</div>
          </div>
          <div className="kpi-card kpi-good">
            <div className="kpi-value">{pesoMedio > 0 ? `${pesoMedio}g` : '-'}</div>
            <div className="kpi-label">Peso Medio</div>
          </div>
          <div className={`kpi-card ${fcr <= 1.5 ? 'kpi-good' : fcr <= 2.0 ? 'kpi-warning' : 'kpi-critical'}`}>
            <div className="kpi-value">{fcr > 0 ? fcr.toFixed(2) : '-'}</div>
            <div className="kpi-label">FCR</div>
          </div>
        </div>
      </div>

      {/* Growth Reference Table */}
      <div className="card">
        <h3 className="card-title">Referencia de Crescimento (Vannamei)</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>DOC</th>
                <th>Peso Esperado</th>
                <th>Racao/dia</th>
              </tr>
            </thead>
            <tbody>
              <tr className={doc <= 15 ? 'active-row' : ''}>
                <td>Bercario</td><td>0-15</td><td>0.01-0.5g</td><td>2-5% biomassa</td>
              </tr>
              <tr className={doc > 15 && doc <= 45 ? 'active-row' : ''}>
                <td>Fase Inicial</td><td>15-45</td><td>0.5-5g</td><td>5-8% biomassa</td>
              </tr>
              <tr className={doc > 45 && doc <= 75 ? 'active-row' : ''}>
                <td>Crescimento</td><td>45-75</td><td>5-12g</td><td>3-5% biomassa</td>
              </tr>
              <tr className={doc > 75 && doc <= 100 ? 'active-row' : ''}>
                <td>Engorda</td><td>75-100</td><td>12-20g</td><td>2-3% biomassa</td>
              </tr>
              <tr className={doc > 100 ? 'active-row' : ''}>
                <td>Despesca</td><td>100+</td><td>20g+</td><td>Reduzir</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Ciclo
