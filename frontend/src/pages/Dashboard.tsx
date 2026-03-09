import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
import '../styles/Dashboard.css'
import '../styles/FazendaDashboardUX.css'

function Dashboard() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [racao, setRacao] = useState<ColetaRacao[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar todos os dados do backend
  useEffect(() => {
    const loadAllData = async () => {
      if (!viveiroId) return
      
      try {
        setLoading(true)
        setError(null)

        // Carregar dados do viveiro
        const viveiroData = await backendApi.getViveiroById(viveiroId)
        setViveiro(viveiroData)

        // Carregar dados em paralelo para melhor performance
        const [racaoData, medicoesData, mortalidadeData] = await Promise.all([
          backendApi.getColetasRacao(viveiroId),
          backendApi.getMedicoes(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId)
        ])

        setRacao(racaoData)
        setMedicoes(medicoesData)
        setMortalidade(mortalidadeData)

      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [viveiroId])

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando dados do dashboard...</div>
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

  // Debug para verificar dados do viveiro
  console.log('Dados do viveiro:', viveiro);
  console.log('Data de início do ciclo:', viveiro.data_inicio_ciclo);
  
  const doc = calcularDOC(viveiro.data_inicio_ciclo)
  console.log('DOC calculado:', doc);
  
  // Usar área e densidade corretamente
  const densidadePorM2 = parseFloat(viveiro.densidade?.toString() || '0') || 0
  const area = parseFloat(viveiro.area?.toString() || '0') || 0
  
  // Calcular população inicial: densidade (larvas/m²) × área (m²)
  const populacaoInicial = densidadePorM2 * area
  
  // Converter para milhar de larvas para as funções existentes
  const densidadeMilLarvas = populacaoInicial / 1000
  
  console.log('Cálculo de população:', {
    densidadePorM2,
    area,
    populacaoInicial,
    densidadeMilLarvas,
    explicacao: `${densidadePorM2} larvas/m² × ${area} m² = ${populacaoInicial} camarões`
  });
  
  const mortalidadeTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const sobrevivencia = calcularSobrevivencia(densidadeMilLarvas, mortalidadeTotal)
  
  // Estimar peso baseado no DOC
  let pesoMedio = 0;
  if (doc <= 0) {
    pesoMedio = 0.015; // PL padrão
  } else if (doc <= 30) {
    pesoMedio = 0.015 + (doc * 0.35); // ~0.35g/dia
  } else if (doc <= 60) {
    pesoMedio = 10.5 + ((doc - 30) * 0.5); // ~0.5g/dia
  } else if (doc <= 90) {
    pesoMedio = 25.5 + ((doc - 60) * 0.35); // ~0.35g/dia
  } else {
    pesoMedio = 36 + ((doc - 90) * 0.2); // ~0.2g/dia
  }
  
  console.log('Peso estimado:', pesoMedio, 'g para DOC', doc);
  
  const biomassa = calcularBiomassa(densidadeMilLarvas, mortalidadeTotal, pesoMedio)
  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const fcr = calcularFCR(racaoTotal, biomassa)
  const custoRacao = racaoTotal * 3 // Preço fixo por enquanto
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

  return (
    <div className="dashboard-container">
      {/* Header Principal */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">🦐 Dashboard do Viveiro</h1>
            <p className="dashboard-subtitle">Painel completo de controle e monitoramento</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="primary-action-btn"
              onClick={() => window.history.back()}
              style={{ backgroundColor: '#6b7280' }}
            >
              🏠 Voltar para Viveiros
            </button>
            <button 
              className="secondary-action-btn"
              onClick={() => window.print()}
            >
              🖨️ Imprimir Relatório
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Principais com Contexto */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Dias de Cultivo</span>
            <span className="kpi-icon">📅</span>
          </div>
          <div className="kpi-value">{doc}</div>
          <div className="kpi-trend positive">
            <span className="trend-icon">📈</span>
            <span className="trend-text">Ciclo ativo</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Camarões Vivos</span>
            <span className="kpi-icon">🦐</span>
          </div>
          <div className="kpi-value">{(populacaoInicial - mortalidadeTotal).toLocaleString('pt-BR')}</div>
          <div className="kpi-trend good">
            <span className="trend-icon">📊</span>
            <span className="trend-text">População atual</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Biomassa Estimada</span>
            <span className="kpi-icon">⚖️</span>
          </div>
          <div className="kpi-value">{biomassa.toFixed(0)} kg</div>
          <div className="kpi-trend positive">
            <span className="trend-icon">↑</span>
            <span className="trend-text">Baseado no peso médio</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">FCR Atual</span>
            <span className="kpi-icon">📈</span>
          </div>
          <div className="kpi-value">{fcr > 0 ? fcr.toFixed(2) : '-'}</div>
          <div className={`kpi-trend ${
            fcr <= 1.5 ? 'excellent' : 
            fcr <= 2.0 ? 'good' : 'warning'
          }`}>
            <span className="trend-icon">
              {fcr <= 1.5 ? '🟢' : fcr <= 2.0 ? '🟡' : '🔴'}
            </span>
            <span className="trend-text">
              {fcr <= 1.5 ? 'Excelente' : fcr <= 2.0 ? 'Bom' : 'Atenção'}
            </span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Sobrevivência</span>
            <span className="kpi-icon">💧</span>
          </div>
          <div className="kpi-value">{sobrevivencia.toFixed(1)}%</div>
          <div className={`kpi-trend ${
            sobrevivencia >= 80 ? 'excellent' : 
            sobrevivencia >= 60 ? 'good' : 'warning'
          }`}>
            <span className="trend-icon">
              {sobrevivencia >= 80 ? '🟢' : sobrevivencia >= 60 ? '🟡' : '🔴'}
            </span>
            <span className="trend-text">
              {sobrevivencia >= 80 ? 'Excelente' : sobrevivencia >= 60 ? 'Bom' : 'Atenção'}
            </span>
          </div>
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
