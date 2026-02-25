import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ColetaRacao, RegistroMortalidade,
  calcularBiomassa, calcularFCR, calcularDOC,
  calcularRacaoDiariaAvancada,
} from '../models/types'
import { backendApi, Viveiro } from '../services/backendApi'

interface ViveiroResumo {
  viveiro: Viveiro
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
  // Novos campos para predição
  pesoEstimadoG: number
  populacaoEstimada: number
  biomassaEstimadaKg: number
  pesoPreditoG: number
  usandoPesoReal: boolean
  plData?: any
}

function FazendaRacao() {
  const navigate = useNavigate()
  const [viveiros, setViveiros] = useState<Viveiro[]>([])
  const [resumos, setResumos] = useState<ViveiroResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para calcular resumo do viveiro
  const calcularResumoViveiro = (viveiro: Viveiro, racao: ColetaRacao[], mortalidade: RegistroMortalidade[]): ViveiroResumo => {
    const doc = calcularDOC(viveiro.data_inicio_ciclo)
    const densidade = viveiro.densidade ?? 0
    const hoje = new Date().toISOString().split('T')[0]

    // Usar a nova função avançada de cálculo
    const calculoAvancado = calcularRacaoDiariaAvancada(
      densidade,
      doc,
      mortalidade,
      0, // pesoMedio não disponível no backend ainda
      undefined // plInicial não disponível no backend
    )

    // Calcular métricas tradicionais para comparação
    const mortTotal = mortalidade.reduce((acc: number, m: RegistroMortalidade) => acc + m.quantidade, 0)
    const biomassaTradicional = calcularBiomassa(densidade, mortTotal, 0)
    const racaoAcumulada = racao.reduce((acc: number, r: ColetaRacao) => acc + r.qntManha + r.qntTarde, 0)
    const fcrAtual = calcularFCR(racaoAcumulada, biomassaTradicional)

    // Check today's feeding
    const registroHoje = racao.find((r: ColetaRacao) => {
      const d = typeof r.data === 'string' ? r.data : new Date(r.data).toISOString().split('T')[0]
      return d === hoje
    })

    return {
      viveiro,
      doc,
      racaoHojeTotal: registroHoje ? registroHoje.qntManha + registroHoje.qntTarde : 0,
      racaoHojeManha: registroHoje ? registroHoje.qntManha : 0,
      racaoHojeTarde: registroHoje ? registroHoje.qntTarde : 0,
      recomendadoTotal: calculoAvancado.totalKg,
      recomendadoManha: calculoAvancado.manhaKg,
      recomendadoTarde: calculoAvancado.tardeKg,
      fase: calculoAvancado.faixa?.fase ?? 'N/A',
      fcrAtual,
      racaoAcumulada,
      biomassa: biomassaTradicional,
      alimentouManha: registroHoje ? registroHoje.qntManha > 0 : false,
      alimentouTarde: registroHoje ? registroHoje.qntTarde > 0 : false,
      // Novos campos de predição
      pesoEstimadoG: calculoAvancado.pesoEstimadoG,
      populacaoEstimada: calculoAvancado.populacaoEstimada,
      biomassaEstimadaKg: calculoAvancado.biomassaEstimadaKg,
      pesoPreditoG: calculoAvancado.pesoEstimadoG,
      usandoPesoReal: false,
      plData: undefined
    }
  }

  // Carregar dados do backend
  useEffect(() => {
    const loadFazendaData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Carregar todos os viveiros
        const viveirosData = await backendApi.getViveiros()
        setViveiros(viveirosData)

        // Carregar dados de cada viveiro em paralelo
        const resumosData = await Promise.all(
          viveirosData.map(async (viveiro: Viveiro) => {
            const [racaoData, mortalidadeData] = await Promise.all([
              backendApi.getColetasRacao(viveiro.id.toString()),
              backendApi.getRegistrosMortalidade(viveiro.id.toString())
            ])

            return calcularResumoViveiro(viveiro, racaoData, mortalidadeData)
          })
        )

        setResumos(resumosData)

      } catch (err) {
        console.error('Erro ao carregar dados da fazenda:', err)
        setError('Erro ao carregar dados da fazenda')
      } finally {
        setLoading(false)
      }
    }

    loadFazendaData()
  }, [])

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

  const totalRacaoHoje = resumos.reduce((acc, r) => acc + r.racaoHojeTotal, 0)
  const totalRecomendado = resumos.reduce((acc, r) => acc + r.recomendadoTotal, 0)
  const totalBiomassa = resumos.reduce((acc, r) => acc + r.biomassa, 0)
  const totalRacaoAcumulada = resumos.reduce((acc, r) => acc + r.racaoAcumulada, 0)
  const fcrMedio = totalBiomassa > 0 ? totalRacaoAcumulada / totalBiomassa : 0

  // Função para exportar dados da fazenda
  const handleExportFazenda = () => {
    try {
      const csvData = [
        ['Viveiro', 'DOC', 'Fase', 'Ração Hoje (kg)', 'Recomendado (kg)', 'Biomassa (kg)', 'FCR', 'Status Alimentação'],
        ...resumos.map(resumo => [
          resumo.viveiro.nome,
          resumo.doc,
          resumo.fase,
          resumo.racaoHojeTotal.toFixed(1),
          resumo.recomendadoTotal.toFixed(1),
          resumo.biomassa.toFixed(0),
          resumo.fcrAtual > 0 ? resumo.fcrAtual.toFixed(2) : '-',
          resumo.alimentouManha && resumo.alimentouTarde ? 'Completo' : resumo.alimentouManha ? 'Parcial' : 'Pendente'
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

    } catch (error) {
      console.error('Erro ao exportar dados da fazenda:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    }
  }

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">
          Visão Geral da Fazenda
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
            <span className="fazenda-value">{resumos.length}</span>
            <span className="fazenda-label">Viveiros Ativos</span>
          </div>
          <div className="fazenda-details">
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{totalRacaoHoje.toFixed(1)} kg</span>
              <span className="fazenda-detail-label">Ração Hoje</span>
            </div>
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{totalRecomendado.toFixed(1)} kg</span>
              <span className="fazenda-detail-label">Recomendado</span>
            </div>
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{totalBiomassa.toFixed(0)} kg</span>
              <span className="fazenda-detail-label">Biomassa Total</span>
            </div>
            <div className="fazenda-detail-item">
              <span className="fazenda-detail-value">{fcrMedio > 0 ? fcrMedio.toFixed(2) : '-'}</span>
              <span className="fazenda-detail-label">FCR Médio</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Status de Alimentação por Viveiro</h3>
        <div className="fazenda-viveiros-grid">
          {resumos.map((resumo) => (
            <div key={resumo.viveiro.id} className="fazenda-viveiro-card" onClick={() => navigate(`/racao/${resumo.viveiro.id}`)}>
              <div className="fazenda-viveiro-header">
                <h4>{resumo.viveiro.nome}</h4>
                <span className="fazenda-viveiro-doc">DOC {resumo.doc}</span>
              </div>
              
              <div className="fazenda-viveiro-status">
                <div className={`fazenda-feed-status ${resumo.alimentouManha && resumo.alimentouTarde ? 'complete' : resumo.alimentouManha ? 'partial' : 'pending'}`}>
                  {resumo.alimentouManha && resumo.alimentouTarde ? '✅ Completo' : resumo.alimentouManha ? '🌅 Manhã' : '⏳ Pendente'}
                </div>
                <div className="fazenda-feed-amount">
                  {resumo.racaoHojeTotal.toFixed(1)} / {resumo.recomendadoTotal.toFixed(1)} kg
                </div>
              </div>

              <div className="fazenda-viveiro-details">
                <div className="fazenda-detail">
                  <span className="fazenda-detail-label">Fase:</span>
                  <span className="fazenda-detail-value">{resumo.fase}</span>
                </div>
                <div className="fazenda-detail">
                  <span className="fazenda-detail-label">Biomassa:</span>
                  <span className="fazenda-detail-value">{resumo.biomassa.toFixed(0)} kg</span>
                </div>
                <div className="fazenda-detail">
                  <span className="fazenda-detail-label">FCR:</span>
                  <span className="fazenda-detail-value">{resumo.fcrAtual > 0 ? resumo.fcrAtual.toFixed(2) : '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Resumo por Viveiro</h3>
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
              </tr>
            </thead>
            <tbody>
              {resumos.map((resumo) => (
                <tr key={resumo.viveiro.id}>
                  <td>
                    <button 
                      className="btn-link" 
                      onClick={() => navigate(`/racao/${resumo.viveiro.id}`)}
                    >
                      {resumo.viveiro.nome}
                    </button>
                  </td>
                  <td>{resumo.doc}</td>
                  <td>{resumo.fase}</td>
                  <td className="text-right">{resumo.racaoHojeTotal.toFixed(1)} kg</td>
                  <td className="text-right">{resumo.recomendadoTotal.toFixed(1)} kg</td>
                  <td className="text-right">{resumo.biomassa.toFixed(0)} kg</td>
                  <td className="text-right">{resumo.fcrAtual > 0 ? resumo.fcrAtual.toFixed(2) : '-'}</td>
                  <td>
                    <span className={`status-badge ${resumo.alimentouManha && resumo.alimentouTarde ? 'complete' : resumo.alimentouManha ? 'partial' : 'pending'}`}>
                      {resumo.alimentouManha && resumo.alimentouTarde ? 'Completo' : resumo.alimentouManha ? 'Parcial' : 'Pendente'}
                    </span>
                  </td>
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

// Estilos para o botão de exportação
const ExportButtonStyles = `
.export-button {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.export-button:active {
  transform: translateY(0);
}
`

// Injetar estilos no documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = ExportButtonStyles
  document.head.appendChild(styleSheet)
}
