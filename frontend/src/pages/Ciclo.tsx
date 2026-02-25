import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  calcularDOC,
  calcularBiomassa,
  calcularSobrevivencia,
  calcularFCR,
} from '../models/types'
import { backendApi, Viveiro, ColetaRacao, RegistroMortalidade } from '../services/backendApi'

function Ciclo() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [racao, setRacao] = useState<ColetaRacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados do backend
  useEffect(() => {
    const loadCicloData = async () => {
      if (!viveiroId) return
      
      try {
        setLoading(true)
        setError(null)

        // Carregar dados em paralelo
        const [viveiroData, mortalidadeData, racaoData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId),
          backendApi.getColetasRacao(viveiroId)
        ])

        setViveiro(viveiroData)
        setMortalidade(mortalidadeData)
        setRacao(racaoData)

      } catch (err) {
        console.error('Erro ao carregar dados do ciclo:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }

    loadCicloData()
  }, [viveiroId])

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando dados do ciclo...</div>
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

  if (!viveiro) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Viveiro não encontrado</div>
      </div>
    )
  }

  const doc = calcularDOC(viveiro.data_inicio_ciclo)
  const densidade = viveiro.densidade ?? 0
  const populacaoInicial = densidade * 1000
  const mortTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const sobrevivencia = calcularSobrevivencia(densidade, mortTotal)
  const pesoMedio = 0 // Peso médio não está disponível no backend ainda
  const biomassa = calcularBiomassa(densidade, mortTotal, pesoMedio)
  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const fcr = calcularFCR(racaoTotal, biomassa)
  const vivos = populacaoInicial - mortTotal

  // Estimate harvest: typical cycle is 90-120 days for Vannamei
  const diasParaDespesca = doc > 0 ? Math.max(0, 100 - doc) : 0
  const dataColheitaEstimada = viveiro.data_inicio_ciclo
    ? new Date(new Date(viveiro.data_inicio_ciclo + 'T00:00:00').getTime() + 100 * 24 * 60 * 60 * 1000)
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

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Ciclo de Cultivo — {viveiro.nome}</div>
        
        <div className="cycle-overview">
          <div className="cycle-main">
            <div className="cycle-phase" style={{ borderColor: fase.cor }}>
              <span className="cycle-phase-name" style={{ color: fase.cor }}>{fase.nome}</span>
              <span className="cycle-phase-desc">{fase.descricao}</span>
            </div>
            <div className="cycle-doc">
              <span className="cycle-doc-value">{doc}</span>
              <span className="cycle-doc-label">DOC</span>
            </div>
          </div>
          
          <div className="cycle-details">
            <div className="cycle-detail">
              <span className="cycle-detail-label">Início:</span>
              <span className="cycle-detail-value">
                {viveiro.data_inicio_ciclo ? new Date(viveiro.data_inicio_ciclo).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
            <div className="cycle-detail">
              <span className="cycle-detail-label">Despesca Est.:</span>
              <span className="cycle-detail-value">
                {dataColheitaEstimada ? dataColheitaEstimada.toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
            <div className="cycle-detail">
              <span className="cycle-detail-label">Dias Restantes:</span>
              <span className="cycle-detail-value">{diasParaDespesca}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Indicadores do Ciclo</h3>
        <div className="cycle-indicators">
          <div className="indicator-group">
            <h4 className="indicator-group-title">População</h4>
            <div className="indicator-grid">
              <div className="indicator-item">
                <span className="indicator-value">{populacaoInicial.toLocaleString()}</span>
                <span className="indicator-label">Inicial</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{vivos.toLocaleString()}</span>
                <span className="indicator-label">Vivos</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{mortTotal.toLocaleString()}</span>
                <span className="indicator-label">Mortalidade</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value" style={{ color: sobrevivencia >= 80 ? 'var(--success)' : sobrevivencia >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                  {sobrevivencia.toFixed(1)}%
                </span>
                <span className="indicator-label">Sobrevivência</span>
              </div>
            </div>
          </div>

          <div className="indicator-group">
            <h4 className="indicator-group-title">Crescimento</h4>
            <div className="indicator-grid">
              <div className="indicator-item">
                <span className="indicator-value">{biomassa.toFixed(0)} kg</span>
                <span className="indicator-label">Biomassa</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{pesoMedio > 0 ? pesoMedio.toFixed(1) : '-'} g</span>
                <span className="indicator-label">Peso Médio</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{densidade}</span>
                <span className="indicator-label">Densidade/m²</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{viveiro.area}</span>
                <span className="indicator-label">Área (m²)</span>
              </div>
            </div>
          </div>

          <div className="indicator-group">
            <h4 className="indicator-group-title">Alimentação</h4>
            <div className="indicator-grid">
              <div className="indicator-item">
                <span className="indicator-value">{racaoTotal.toFixed(1)} kg</span>
                <span className="indicator-label">Ração Total</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value" style={{ color: fcr <= 1.5 ? 'var(--success)' : fcr <= 2.0 ? 'var(--warning)' : 'var(--danger)' }}>
                  {fcr > 0 ? fcr.toFixed(2) : '-'}
                </span>
                <span className="indicator-label">FCR</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{racao.length}</span>
                <span className="indicator-label">Dias Alimentados</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-value">{racaoTotal > 0 ? (racaoTotal / doc).toFixed(1) : '-'} kg/dia</span>
                <span className="indicator-label">Média Diária</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Fases do Ciclo</h3>
        <div className="cycle-phases">
          {[
            { doc: 0, nome: 'Sem ciclo', cor: 'var(--text-light)' },
            { doc: 15, nome: 'Berçario', cor: 'var(--info)' },
            { doc: 45, nome: 'Fase Inicial', cor: 'var(--primary)' },
            { doc: 75, nome: 'Crescimento', cor: 'var(--success)' },
            { doc: 100, nome: 'Engorda', cor: 'var(--warning)' },
            { doc: 120, nome: 'Despesca', cor: 'var(--danger)' },
          ].map((fase, index) => (
            <div 
              key={index} 
              className={`cycle-phase-item ${doc >= fase.doc ? 'completed' : doc >= (index > 0 ? [0, 15, 45, 75, 100][index - 1] : 0) ? 'current' : 'pending'}`}
              style={{ borderColor: fase.cor }}
            >
              <div className="cycle-phase-marker" style={{ backgroundColor: fase.cor }}></div>
              <div className="cycle-phase-info">
                <span className="cycle-phase-doc">DOC {fase.doc}</span>
                <span className="cycle-phase-name">{fase.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Recomendações</h3>
        <div className="cycle-recommendations">
          {doc === 0 && (
            <div className="recommendation warning">
              <strong>Iniciar Ciclo:</strong> Defina a data de início do ciclo para começar o acompanhamento.
            </div>
          )}
          {doc > 0 && doc <= 15 && (
            <div className="recommendation info">
              <strong>Fase de Berçário:</strong> Mantenha alimentação leve (2-3% da biomassa/dia). Monitore oxigênio e pH constantemente.
            </div>
          )}
          {doc > 15 && doc <= 45 && (
            <div className="recommendation primary">
              <strong>Fase Inicial:</strong> Aumente gradualmente a ração (3-4% da biomassa/dia). Faça medições diárias da qualidade da água.
            </div>
          )}
          {doc > 45 && doc <= 75 && (
            <div className="recommendation success">
              <strong>Fase de Crescimento:</strong> Ração em 4-5% da biomassa/dia. Ajuste conforme ganho de peso. Mantenha aeradores ligados.
            </div>
          )}
          {doc > 75 && doc <= 100 && (
            <div className="recommendation warning">
              <strong>Fase de Engorda:</strong> Reduza para 3-4% da biomassa/dia. Monitore FCR semanalmente. Prepare para despesca.
            </div>
          )}
          {doc > 100 && (
            <div className="recommendation danger">
              <strong>Pronto para Despesca:</strong> Avalie peso médio e condições de mercado. Programe a colheita.
            </div>
          )}
          {sobrevivencia < 60 && doc > 0 && (
            <div className="recommendation danger">
              <strong>Atenção:</strong> Sobrevivência baixa ({sobrevivencia.toFixed(1)}%). Investigar causas da mortalidade.
            </div>
          )}
          {fcr > 2.0 && racaoTotal > 0 && (
            <div className="recommendation warning">
              <strong>FCR Elevado:</strong> FCR atual ({fcr.toFixed(2)}) acima do ideal. Revisar estratégia alimentar e qualidade da água.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Ciclo
