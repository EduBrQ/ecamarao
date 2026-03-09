import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApi } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'
import { calcularRacaoSimples } from '../models/CalculadoraRacao'
import '../styles/FazendaDashboard.css'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
  // Novos campos da calculadora avançada
  usandoNovaCalculadora: boolean
  faixaPeso: string
  faseCultivo: string
  taxaAlimentacaoDecimal: number
  analiseCultivo?: {
    recomendacoes: string[]
    pontosAtencao: string[]
  }
  racoes: Array<{
    id: number
    data: string
    qntManha: number
    qntTarde: number
    total: number
  }>
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

// Função utilitária para normalizar datas
const normalizeDate = (date: string | Date): string => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return '';
};

// Função para prever alimentação usando IA
const preverAlimentacao = (viveiro: any, dias: number = 1) => {
  const biomassaAtual = viveiro.biomassa || 0;
  const doc = viveiro.doc || 0;
  const taxaCrescimentoDiaria = 0.025; // 2.5% ao dia
  
  // Prever biomassa futura
  const biomassaFutura = biomassaAtual * Math.pow(1 + taxaCrescimentoDiaria, dias);
  
  // Calcular taxa de alimentação baseada na biomassa futura e fase
  let taxaAlimentacao = 0.08; // Base 8%
  
  if (doc <= 30) taxaAlimentacao = 0.06; // Fase inicial
  else if (doc <= 60) taxaAlimentacao = 0.08; // Crescimento
  else if (doc <= 90) taxaAlimentacao = 0.10; // Engorda
  else taxaAlimentacao = 0.08; // Final
  
  // Fator de temperatura (simulado)
  const fatorTemperatura = 1.1; // +10% por temperatura ideal
  
  const racaoPrevista = biomassaFutura * taxaAlimentacao * fatorTemperatura;
  
  return {
    racaoHoje: racaoPrevista,
    biomassaFutura,
    crescimentoPercentual: ((biomassaFutura - biomassaAtual) / biomassaAtual) * 100,
    tendencia: racaoPrevista > viveiro.recomendadoTotal ? 'aumento' : 'estavel'
  };
};

// Função para calcular score de saúde do viveiro
const calcularScoreSaude = (viveiro: any): {
  score: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  cor: string;
  fatores: {
    fcr: number;
    crescimento: number;
    consistencia: number;
    sobrevivencia: number;
  };
} => {
  // Score FCR (0-30 pontos)
  let scoreFCR = 0;
  if (viveiro.fcrAtual > 0) {
    if (viveiro.fcrAtual < 1.5) scoreFCR = 30;
    else if (viveiro.fcrAtual < 1.8) scoreFCR = 25;
    else if (viveiro.fcrAtual < 2.0) scoreFCR = 20;
    else if (viveiro.fcrAtual < 2.5) scoreFCR = 10;
    else scoreFCR = 0;
  }
  
  // Score Crescimento (0-25 pontos)
  const biomassaEsperada = viveiro.populacaoEstimada * 0.015; // 15g por camarão
  const crescimentoReal = viveiro.biomassa / biomassaEsperada;
  const scoreCrescimento = Math.min(25, crescimentoReal * 25);
  
  // Score Consistência (0-25 pontos)
  let scoreConsistencia = 15; // Base
  const diasUltimos7 = viveiro.racoes.slice(-7);
  if (diasUltimos7.length >= 5) {
    const mediaConsumo = diasUltimos7.reduce((sum: number, r: any) => sum + r.total, 0) / diasUltimos7.length;
    const variacao = diasUltimos7.reduce((sum: number, r: any) => sum + Math.abs(r.total - mediaConsumo), 0) / diasUltimos7.length;
    scoreConsistencia = Math.max(0, 25 - (variacao * 5));
  }
  
  // Score Sobrevivência (0-20 pontos)
  let scoreSobrevivencia = 15; // Base
  if (viveiro.populacaoEstimada && viveiro.viveiro.densidade && viveiro.viveiro.area) {
    const populacaoInicial = viveiro.viveiro.densidade * viveiro.viveiro.area;
    const taxaSobrevivencia = viveiro.populacaoEstimada / populacaoInicial;
    scoreSobrevivencia = Math.min(20, taxaSobrevivencia * 20);
  }
  
  const scoreTotal = scoreFCR + scoreCrescimento + scoreConsistencia + scoreSobrevivencia;
  
  let status: 'excelente' | 'bom' | 'atencao' | 'critico';
  let cor: string;
  
  if (scoreTotal >= 85) {
    status = 'excelente';
    cor = '#10b981';
  } else if (scoreTotal >= 70) {
    status = 'bom';
    cor = '#22c55e';
  } else if (scoreTotal >= 50) {
    status = 'atencao';
    cor = '#f59e0b';
  } else {
    status = 'critico';
    cor = '#ef4444';
  }
  
  return {
    score: Math.round(scoreTotal),
    status,
    cor,
    fatores: {
      fcr: scoreFCR,
      crescimento: scoreCrescimento,
      consistencia: scoreConsistencia,
      sobrevivencia: scoreSobrevivencia
    }
  };
};

// Função para detectar anomalias
const detectarAnomalias = (viveiro: any): {
  tipo: string;
  severidade: 'baixa' | 'media' | 'alta';
  mensagem: string;
  recomendacao: string;
}[] => {
  const anomalias: {
    tipo: string;
    severidade: 'baixa' | 'media' | 'alta';
    mensagem: string;
    recomendacao: string;
  }[] = [];
  
  // Detectar queda de consumo
  const diasUltimos7 = viveiro.racoes.slice(-7);
  if (diasUltimos7.length >= 3) {
    const mediaRecente = diasUltimos7.slice(-3).reduce((sum: number, r: any) => sum + r.total, 0) / 3;
    const mediaAnterior = diasUltimos7.slice(0, -3).reduce((sum: number, r: any) => sum + r.total, 0) / (diasUltimos7.length - 3);
    
    if (mediaRecente < mediaAnterior * 0.7) {
      anomalias.push({
        tipo: 'queda_consumo',
        severidade: 'alta',
        mensagem: `Consumo caiu ${((1 - mediaRecente/mediaAnterior) * 100).toFixed(0)}% nos últimos 3 dias`,
        recomendacao: 'Verificar saúde dos camarões e qualidade da água'
      });
    }
  }
  
  // Detectar FCR elevado
  if (viveiro.fcrAtual > 2.5) {
    anomalias.push({
      tipo: 'fcr_elevado',
      severidade: 'media',
      mensagem: `FCR de ${viveiro.fcrAtual.toFixed(2)} está acima do ideal`,
      recomendacao: 'Ajustar quantidade de ração e verificar desperdícios'
    });
  }
  
  // Detectar inconsistência na alimentação
  const diasAlimentados = viveiro.racoes.filter((r: any) => r.total > 0).length;
  const diasTotais = viveiro.racoes.length;
  if (diasAlimentados < diasTotais * 0.8) {
    anomalias.push({
      tipo: 'inconsistencia_alimentacao',
      severidade: 'media',
      mensagem: `${((diasTotais - diasAlimentados) / diasTotais * 100).toFixed(0)}% dos dias sem alimentação registrada`,
      recomendacao: 'Manter consistência nos registros diários'
    });
  }
  
  return anomalias;
};

// Função para gerar previsão de produção
const preverProducao = (viveiro: any): {
  pesoMedioEstimado: number;
  producaoEstimada: number;
  dataColheita: Date;
  diasAteColheita: number;
} => {
  const doc = viveiro.doc || 0;
  const biomassaAtual = viveiro.biomassa || 0;
  
  // Peso médio estimado baseado em curva de crescimento
  let pesoMedioEstimado = 0;
  if (doc <= 30) pesoMedioEstimado = 0.02;
  else if (doc <= 60) pesoMedioEstimado = 0.08;
  else if (doc <= 90) pesoMedioEstimado = 0.15;
  else if (doc <= 120) pesoMedioEstimado = 0.25;
  else pesoMedioEstimado = 0.35;
  
  // Taxa de crescimento diária
  const taxaCrescimentoDiaria = 0.018; // 1.8% ao dia
  
  // Dias até atingir peso de colheita (25g)
  const diasAteColheita = Math.max(0, Math.ceil(Math.log(25 / pesoMedioEstimado) / Math.log(1 + taxaCrescimentoDiaria)));
  
  // Prever biomassa na colheita
  const biomassaColheita = biomassaAtual * Math.pow(1 + taxaCrescimentoDiaria, diasAteColheita);
  
  // Data estimada de colheita
  const dataColheita = new Date();
  dataColheita.setDate(dataColheita.getDate() + diasAteColheita);
  
  return {
    pesoMedioEstimado: parseFloat(pesoMedioEstimado.toFixed(2)),
    producaoEstimada: parseFloat(biomassaColheita.toFixed(0)),
    dataColheita,
    diasAteColheita
  };
};

function FazendaRacao() {
  const navigate = useNavigate()
  const toast = useToastGlobal()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendentes' | 'alimentados' | 'parciais'>('todos')
  const [visualMode, setVisualMode] = useState<'grid' | 'list'>('grid')
  
  // Estados para modais de quantidade
  const [quantidadeModal, setQuantidadeModal] = useState<{
    isOpen: boolean
    viveiroId: number
    periodo: 'manha' | 'tarde'
    quantidade: string
  }>({
    isOpen: false,
    viveiroId: 0,
    periodo: 'manha',
    quantidade: ''
  })

  // Estado para modal de status
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean
    tipo: 'completo' | 'parcial' | 'pendente'
    viveiros: any[]
  }>({
    isOpen: false,
    tipo: 'completo',
    viveiros: []
  });

  // Estado para modal de dias sem ração
  const [diasSemRacaoModal, setDiasSemRacaoModal] = useState<{
    isOpen: boolean
    viveiroId: number
    viveiroNome: string
    diasEmFalta: Array<{
      data: string
      doc: number
      racaoManha: string
      racaoTarde: string
    }>
  }>({
    isOpen: false,
    viveiroId: 0,
    viveiroNome: '',
    diasEmFalta: []
  });

  // Carregar dados do dashboard
  useEffect(() => {
    const carregarDashboard = async () => {
      try {
        setLoading(true)
        const dashboardData = await backendApi.getDashboardFazenda()
        
        // Calcular valores com nova calculadora para cada viveiro
        const dashboardComCalculos = {
          ...dashboardData,
          viveiros: dashboardData.viveiros.map((viveiro: any) => {
            // Usar nova calculadora
            const resultadoCalculadora = calcularRacaoLocal({
              viveiro: viveiro.viveiro,
              doc: viveiro.doc,
              biomassaEstimadaKg: 0,
              pesoEstimadoG: 0,
              usandoNovaCalculadora: false
            });
            
            // Atualizar viveiro com valores calculados
            return {
              ...viveiro,
              recomendadoTotal: resultadoCalculadora.racaoTotalDia,
              recomendadoManha: resultadoCalculadora.racaoManha,
              recomendadoTarde: resultadoCalculadora.racaoTarde,
              fase: resultadoCalculadora.faseCultivo,
              fcrAtual: viveiro.racaoAcumulada > 0 && resultadoCalculadora.biomassa > 0 ? 
                (viveiro.racaoAcumulada / resultadoCalculadora.biomassa) : 0,
              biomassa: resultadoCalculadora.biomassa,
              pesoEstimadoG: viveiro.pesoEstimadoG || 0,
              populacaoEstimada: viveiro.populacaoEstimada || 0,
              biomassaEstimadaKg: resultadoCalculadora.biomassa,
              usandoNovaCalculadora: true,
              faixaPeso: resultadoCalculadora.faixaPeso,
              faseCultivo: resultadoCalculadora.faseCultivo,
              taxaAlimentacaoDecimal: resultadoCalculadora.taxaAlimentacao,
              analiseCultivo: resultadoCalculadora.analiseCultivo
            };
          })
        };
        
        // Recalcular totais
        const totaisRecalculados = {
          ...dashboardData.totais,
          totalRecomendado: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.recomendadoTotal, 0),
          totalBiomassa: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.biomassa, 0),
          fcrMedio: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.fcrAtual, 0) / dashboardComCalculos.viveiros.length || 0
        };
        
        setDashboard({
          ...dashboardComCalculos,
          totais: totaisRecalculados
        })
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
        setError('Não foi possível carregar os dados da fazenda')
      } finally {
        setLoading(false)
      }
    }

    carregarDashboard()
  }, [])

  // Função para exportar dados da fazenda (CSV - mantida para compatibilidade)
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

  // Função para exportar relatório PDF avançado
  const handleExportPDF = async () => {
    if (!dashboard) {
      toast.error('Sem dados', 'Carregue o dashboard antes de exportar')
      return
    }

    try {
      toast.info('Gerando PDF', 'Aguarde enquanto o relatório é gerado...')
      
      // Criar elemento temporário para o relatório
      const reportElement = document.createElement('div')
      reportElement.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 210mm;
        padding: 20px;
        background: white;
        font-family: Arial, sans-serif;
        color: #333;
      `
      
      // Data atual
      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      // Cálculos para o resumo do CICLO GERAL
      const totalRacaoAcumulada = dashboard.viveiros.reduce((sum, v) => sum + v.racaoAcumulada, 0)
      const totalBiomassa = dashboard.viveiros.reduce((sum, v) => sum + v.biomassa, 0)
      const fcrMedio = dashboard.viveiros.reduce((sum, v) => sum + v.fcrAtual, 0) / dashboard.viveiros.filter(v => v.fcrAtual > 0).length || 0
      
      // Calcular médias do ciclo
      const diasMedioCultivo = dashboard.viveiros.reduce((sum, v) => sum + v.doc, 0) / dashboard.viveiros.length
      const biomassaMedia = totalBiomassa / dashboard.viveiros.length
      const racaoMediaPorViveiro = totalRacaoAcumulada / dashboard.viveiros.length
      
      // Análise de fases do ciclo
      const fasesCultivo: Record<string, number> = dashboard.viveiros.reduce((acc: Record<string, number>, v) => {
        acc[v.fase] = (acc[v.fase] || 0) + 1
        return acc
      }, {})

      // Viveiros por status
      const viveirosAtivos = dashboard.viveiros.filter(v => v.viveiro.status === 'ativo').length
      const viveirosInativos = dashboard.viveiros.filter(v => v.viveiro.status === 'inativo').length
      const viveirosManutencao = dashboard.viveiros.filter(v => v.viveiro.status === 'manutencao').length

      // Análise de performance
      const viveirosAcimaMeta = dashboard.viveiros.filter(v => v.fcrAtual > 0 && v.fcrAtual < 1.8).length
      const viveirosAbaixoMeta = dashboard.viveiros.filter(v => v.fcrAtual > 0 && v.fcrAtual >= 1.8).length
      const viveirosSemFCR = dashboard.viveiros.filter(v => v.fcrAtual === 0).length

      // Montar HTML do relatório
      reportElement.innerHTML = `
        <div style="margin-bottom: 30px; text-align: center;">
          <h1 style="margin: 0; color: #1f2937; font-size: 28px; margin-bottom: 10px;">
            🦐 Relatório de Ciclo - EcoMarão
          </h1>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Análise completa do ciclo de cultivo - Gerado em ${dataAtual}
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            📊 Resumo do Ciclo
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold; width: 50%;">Total de Viveiros</td>
              <td style="padding: 10px; background: #f9fafb;">${dashboard.viveiros.length}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Ração Acumulada no Ciclo</td>
              <td style="padding: 10px; background: #f9fafb;">${totalRacaoAcumulada.toFixed(1)} kg</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Biomassa Total Atual</td>
              <td style="padding: 10px; background: #f9fafb;">${totalBiomassa.toFixed(0)} kg</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">FCR Médio do Ciclo</td>
              <td style="padding: 10px; background: #f9fafb;">${fcrMedio > 0 ? fcrMedio.toFixed(2) : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Média de Dias de Cultivo</td>
              <td style="padding: 10px; background: #f9fafb;">${diasMedioCultivo.toFixed(0)} dias</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Ração Média por Viveiro</td>
              <td style="padding: 10px; background: #f9fafb;">${racaoMediaPorViveiro.toFixed(1)} kg</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            🏢 Status dos Viveiros
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; background: #dcfce7; font-weight: bold; width: 50%;">🟢 Viveiros Ativos</td>
              <td style="padding: 10px; background: #f0fdf4;">${viveirosAtivos} viveiros</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #fee2e2; font-weight: bold;">🔴 Viveiros Inativos</td>
              <td style="padding: 10px; background: #fef2f2;">${viveirosInativos} viveiros</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #fef3c7; font-weight: bold;">🟡 Viveiros em Manutenção</td>
              <td style="padding: 10px; background: #fffbeb;">${viveirosManutencao} viveiros</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            � Análise de Performance
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; background: #dcfce7; font-weight: bold; width: 50%;">✅ Acima da Meta (FCR &lt; 1.8)</td>
              <td style="padding: 10px; background: #f0fdf4;">${viveirosAcimaMeta} viveiros (${((viveirosAcimaMeta / dashboard.viveiros.length) * 100).toFixed(1)}%)</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #fee2e2; font-weight: bold;">⚠️ Abaixo da Meta (FCR ≥ 1.8)</td>
              <td style="padding: 10px; background: #fef2f2;">${viveirosAbaixoMeta} viveiros (${((viveirosAbaixoMeta / dashboard.viveiros.length) * 100).toFixed(1)}%)</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">📊 Sem Dados de FCR</td>
              <td style="padding: 10px; background: #f9fafb;">${viveirosSemFCR} viveiros (${((viveirosSemFCR / dashboard.viveiros.length) * 100).toFixed(1)}%)</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            � Distribuição por Fase de Cultivo
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${Object.entries(fasesCultivo).map(([fase, quantidade]: [string, number]) => `
              <tr>
                <td style="padding: 10px; background: #f3f4f6; font-weight: bold; width: 50%;">${fase}</td>
                <td style="padding: 10px; background: #f9fafb;">${quantidade} viveiros (${((quantidade / dashboard.viveiros.length) * 100).toFixed(1)}%)</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            📈 Indicadores do Ciclo por Viveiro
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">Viveiro</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">Status</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">DOC</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">Fase</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">Biomassa (kg)</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">Ração Acumulada (kg)</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">FCR</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">Performance</th>
              </tr>
            </thead>
            <tbody>
              ${dashboard.viveiros.map(viveiro => {
                const performance = viveiro.fcrAtual > 0 
                  ? viveiro.fcrAtual < 1.8 ? '🟢 Acima da Meta' 
                  : viveiro.fcrAtual < 2.2 ? '🟡 Aceitável' 
                  : '🔴 Abaixo da Meta'
                  : '📊 Sem Dados'
                
                const performanceColor = viveiro.fcrAtual > 0 
                  ? viveiro.fcrAtual < 1.8 ? '#dcfce7' 
                  : viveiro.fcrAtual < 2.2 ? '#fef3c7' 
                  : '#fee2e2'
                  : '#f3f4f6'
                
                const statusColor = viveiro.viveiro.status === 'ativo' ? '#dcfce7' 
                  : viveiro.viveiro.status === 'inativo' ? '#fee2e2' 
                  : '#fef3c7'
                
                return `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${viveiro.viveiro.nome}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; background: ${statusColor}; font-weight: bold;">${viveiro.viveiro.status.toUpperCase()}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${viveiro.doc}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${viveiro.fase}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${viveiro.biomassa.toFixed(0)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${viveiro.racaoAcumulada.toFixed(1)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; background: ${performanceColor}; font-weight: bold;">${performance}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            📊 Métricas Consolidadas
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold; width: 50;">Biomassa Média por Viveiro</td>
              <td style="padding: 10px; background: #f9fafb;">${biomassaMedia.toFixed(0)} kg</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Eficiência Geral do Ciclo</td>
              <td style="padding: 10px; background: #f9fafb; font-weight: bold; color: ${fcrMedio < 1.8 ? '#059669' : fcrMedio < 2.2 ? '#d97706' : '#dc2626'};">
                ${fcrMedio < 1.8 ? '🟢 Excelente' : fcrMedio < 2.2 ? '🟡 Boa' : '🔴 Precisa Melhorar'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f3f4f6; font-weight: bold;">Taxa de Conversão Média</td>
              <td style="padding: 10px; background: #f9fafb;">${totalBiomassa > 0 ? (totalRacaoAcumulada / totalBiomassa).toFixed(2) : '-'} kg ração/kg biomassa</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="margin: 0;">Relatório de ciclo gerado automaticamente pelo sistema EcoMarão</p>
          <p style="margin: 5px 0 0 0;">🦐 Sistema de Gestão de Camarões - Análise Completa do Ciclo</p>
        </div>
      `

      document.body.appendChild(reportElement)

      // Gerar PDF
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Calcular dimensões para ajustar à página A4
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      
      // Salvar PDF
      const fileName = `relatorio_ciclo_ecamarao_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      // Limpar elemento temporário
      document.body.removeChild(reportElement)

      toast.success('PDF gerado', `Relatório de ciclo salvo como ${fileName}`)

    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF', 'Não foi possível gerar o relatório PDF. Tente novamente.')
    }
  }

  // Função para registrar alimentação rápida
  const handleAlimentacaoRapida = async (viveiroId: number, periodo: 'manha' | 'tarde') => {
    // Abrir modal com quantidade pré-preenchida
    const viveiro = dashboard?.viveiros.find(v => v.viveiro.id === viveiroId)
    if (!viveiro) return
    
    // Calcular recomendação localmente se não tiver valores
    let quantidadeRecomendada = periodo === 'manha' 
      ? viveiro.recomendadoManha 
      : viveiro.recomendadoTarde;
    
    // Se os valores recomendados forem 0, calcular localmente
    if (quantidadeRecomendada === 0) {
      const resultadoCalculadora = calcularRacaoLocal({
        viveiro: viveiro.viveiro,
        doc: viveiro.doc,
        biomassaEstimadaKg: 0,
        pesoEstimadoG: 0,
        usandoNovaCalculadora: false
      });
      
      quantidadeRecomendada = periodo === 'manha' 
        ? resultadoCalculadora.racaoManha 
        : resultadoCalculadora.racaoTarde;
    }
    
    setQuantidadeModal({
      isOpen: true,
      viveiroId,
      periodo,
      quantidade: quantidadeRecomendada.toString()
    })
  }

  const handleConfirmarQuantidade = async () => {
    const { viveiroId, periodo, quantidade } = quantidadeModal

    if (!quantidade || parseFloat(quantidade) <= 0) {
      toast.error('Quantidade inválida', 'Insira uma quantidade válida de ração')
      return
    }

    try {
      let quantidadeManha: number | undefined
      
      // Se for alimentação da tarde, buscar valor da manhã
      if (periodo === 'tarde') {
        try {
          const hoje = new Date().toISOString().split('T')[0]
          const racoesHoje = await backendApi.getColetasRacao(viveiroId.toString())
          const registroManha = racoesHoje.find((r: any) => r.data === hoje)
          
          if (registroManha && registroManha.qntManha) {
            quantidadeManha = registroManha.qntManha
          }
        } catch {
          // Silently continue if morning record not found
        }
      }
      
      await backendApi.registrarAlimentacao(viveiroId, periodo, parseFloat(quantidade), quantidadeManha)
      
      // Recarregar dados e recalcular
      const dashboardData = await backendApi.getDashboardFazenda()
      
      // Recalcular com nova calculadora
      const dashboardComCalculos = {
        ...dashboardData,
        viveiros: dashboardData.viveiros.map((viveiro: any) => {
          const resultadoCalculadora = calcularRacaoLocal({
            viveiro: viveiro.viveiro,
            doc: viveiro.doc,
            biomassaEstimadaKg: 0,
            pesoEstimadoG: 0,
            usandoNovaCalculadora: false
          });
          
          return {
            ...viveiro,
            recomendadoTotal: resultadoCalculadora.racaoTotalDia,
            recomendadoManha: resultadoCalculadora.racaoManha,
            recomendadoTarde: resultadoCalculadora.racaoTarde,
            fase: resultadoCalculadora.faseCultivo,
            fcrAtual: viveiro.racaoAcumulada > 0 && resultadoCalculadora.biomassa > 0 ? 
              (viveiro.racaoAcumulada / resultadoCalculadora.biomassa) : 0,
            biomassa: resultadoCalculadora.biomassa,
            pesoEstimadoG: resultadoCalculadora.pesoMedio || 0,
            populacaoEstimada: resultadoCalculadora.populacao || 0,
            biomassaEstimadaKg: resultadoCalculadora.biomassa,
            usandoNovaCalculadora: true,
            faixaPeso: resultadoCalculadora.faixaPeso,
            faseCultivo: resultadoCalculadora.faseCultivo,
            taxaAlimentacaoDecimal: resultadoCalculadora.taxaAlimentacao,
            analiseCultivo: resultadoCalculadora.analiseCultivo
          };
        })
      };
      
      const totaisRecalculados = {
        ...dashboardData.totais,
        totalRecomendado: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.recomendadoTotal, 0),
        totalBiomassa: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.biomassa, 0),
        fcrMedio: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.fcrAtual, 0) / dashboardComCalculos.viveiros.length || 0
      };
      
      setDashboard({
        ...dashboardComCalculos,
        totais: totaisRecalculados
      })
      
      toast.success(
        'Alimentação registrada', 
        `${periodo === 'manha' ? 'Manhã' : 'Tarde'}: ${quantidade} kg`
      )
      
      // Fechar modal
      setQuantidadeModal({
        isOpen: false,
        viveiroId: 0,
        periodo: 'manha',
        quantidade: ''
      })
    } catch (error) {
      console.error('Erro ao registrar alimentação:', error)
      toast.error('Erro', 'Não foi possível registrar a alimentação')
    }
  }

  const handleCancelarQuantidade = () => {
    setQuantidadeModal({
      isOpen: false,
      viveiroId: 0,
      periodo: 'manha',
      quantidade: ''
    })
  }

  // Funções para abrir modal de status
  const handleStatusClick = (tipo: 'completo' | 'parcial' | 'pendente') => {
    if (!dashboard) return;
    
    const hoje = new Date().toISOString().split('T')[0];
    const viveirosFiltrados = dashboard.viveiros.filter((viveiro: any) => {
      const racaoHoje = viveiro.racoes.find((r: any) => normalizeDate(r.data) === hoje);
      
      if (!racaoHoje) {
        return tipo === 'pendente';
      }
      
      const alimentouManha = racaoHoje.qntManha > 0;
      const alimentouTarde = racaoHoje.qntTarde > 0;
      
      switch (tipo) {
        case 'completo':
          return alimentouManha && alimentouTarde;
        case 'parcial':
          return (alimentouManha || alimentouTarde) && !(alimentouManha && alimentouTarde);
        case 'pendente':
          return !alimentouManha || !alimentouTarde; // Inclui parciais e não alimentados
        default:
          return false;
      }
    });
    
    setStatusModal({
      isOpen: true,
      tipo,
      viveiros: viveirosFiltrados
    });
  }

  const handleFecharStatusModal = () => {
    setStatusModal({
      isOpen: false,
      tipo: 'completo',
      viveiros: []
    });
  }

  // Função para verificar se há dias em falta para um viveiro
  const verificarDiasEmFalta = (viveiroId: number) => {
    const viveiro = dashboard?.viveiros.find(v => v.viveiro.id === viveiroId);
    if (!viveiro) return false;

    // Calcular dias sem ração desde o início do ciclo
    const dataInicio = new Date(viveiro.viveiro.data_inicio_ciclo);
    const hoje = new Date();
    const diasCultivo = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));

    // Verificar últimos 30 dias ou dias totais do cultivo
    const diasParaVerificar = Math.min(30, diasCultivo);
    
    for (let i = diasCultivo - diasParaVerificar + 1; i <= diasCultivo; i++) {
      const dataVerificar = new Date(dataInicio);
      dataVerificar.setDate(dataInicio.getDate() + i);
      
      const dataFormatada = dataVerificar.toISOString().split('T')[0];
      
      // Verificar se tem registro de ração neste dia
      const registroRacao = viveiro.racoes.find(r => normalizeDate(r.data) === dataFormatada);
      
      if (!registroRacao || (registroRacao.qntManha === 0 && registroRacao.qntTarde === 0)) {
        return true; // Encontrou pelo menos um dia em falta
      }
    }
    
    return false; // Não há dias em falta
  };

  // Função para abrir modal de dias sem ração
  const handleDiasSemRacao = (viveiroId: number) => {
    const viveiro = dashboard?.viveiros.find(v => v.viveiro.id === viveiroId);
    if (!viveiro) return;

    // Calcular dias sem ração desde o início do ciclo
    const dataInicio = new Date(viveiro.viveiro.data_inicio_ciclo);
    const hoje = new Date();
    const diasCultivo = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));

    // Gerar lista de dias para registrar
    const diasEmFalta: Array<{
      data: string;
      doc: number;
      racaoManha: string;
      racaoTarde: string;
    }> = [];

    // Verificar últimos 30 dias ou dias totais do cultivo
    const diasParaVerificar = Math.min(30, diasCultivo);
    
    for (let i = diasCultivo - diasParaVerificar + 1; i <= diasCultivo; i++) {
      const dataVerificar = new Date(dataInicio);
      dataVerificar.setDate(dataInicio.getDate() + i);
      
      const dataFormatada = dataVerificar.toISOString().split('T')[0];
      const doc = i + 1;
      
      // Verificar se tem registro de ração neste dia
      const registroRacao = viveiro.racoes.find(r => normalizeDate(r.data) === dataFormatada);
      
      if (!registroRacao || (registroRacao.qntManha === 0 && registroRacao.qntTarde === 0)) {
        diasEmFalta.push({
          data: dataFormatada,
          doc: doc,
          racaoManha: '',
          racaoTarde: ''
        });
      }
    }

    setDiasSemRacaoModal({
      isOpen: true,
      viveiroId: viveiro.viveiro.id,
      viveiroNome: viveiro.viveiro.nome,
      diasEmFalta: diasEmFalta
    });
  };

  // Função para fechar modal de dias sem ração
  const handleFecharDiasSemRacao = () => {
    setDiasSemRacaoModal({
      isOpen: false,
      viveiroId: 0,
      viveiroNome: '',
      diasEmFalta: []
    });
  };

  // Função para atualizar quantidade no modal
  const handleAtualizarQuantidadeDia = (index: number, campo: 'racaoManha' | 'racaoTarde', valor: string) => {
    setDiasSemRacaoModal(prev => ({
      ...prev,
      diasEmFalta: prev.diasEmFalta.map((dia, i) => 
        i === index ? { ...dia, [campo]: valor } : dia
      )
    }));
  };

  // Função para registrar dias sem ração
  const handleRegistrarDiasSemRacao = async () => {
    const { viveiroId, diasEmFalta } = diasSemRacaoModal;

    try {
      for (const dia of diasEmFalta) {
        const qntManha = parseFloat(dia.racaoManha) || 0;
        const qntTarde = parseFloat(dia.racaoTarde) || 0;

        if (qntManha > 0 || qntTarde > 0) {
          // Registrar manhã com a data específica do dia
          if (qntManha > 0) {
            await backendApi.registrarAlimentacaoEspecifica(
              viveiroId, 
              dia.data,
              'manha', 
              qntManha
            );
          }
          
          // Registrar tarde com a data específica do dia
          if (qntTarde > 0) {
            await backendApi.registrarAlimentacaoEspecifica(
              viveiroId, 
              dia.data,
              'tarde', 
              qntTarde,
              qntManha > 0 ? qntManha : 0
            );
          }
        }
      }

      toast.success('Dias registrados', `${diasEmFalta.length} dias de ração foram registrados com sucesso`);
      
      // Recarregar dashboard
      const dashboardData = await backendApi.getDashboardFazenda();
      
      // Recalcular com nova calculadora
      const dashboardComCalculos = {
        ...dashboardData,
        viveiros: dashboardData.viveiros.map((viveiro: any) => {
          const resultadoCalculadora = calcularRacaoLocal({
            viveiro: viveiro.viveiro,
            doc: viveiro.doc,
            biomassaEstimadaKg: 0,
            pesoEstimadoG: 0,
            usandoNovaCalculadora: false
          });
          
          return {
            ...viveiro,
            recomendadoTotal: resultadoCalculadora.racaoTotalDia,
            recomendadoManha: resultadoCalculadora.racaoManha,
            recomendadoTarde: resultadoCalculadora.racaoTarde,
            fase: resultadoCalculadora.faseCultivo,
            fcrAtual: viveiro.racaoAcumulada > 0 && resultadoCalculadora.biomassa > 0 ? 
              (viveiro.racaoAcumulada / resultadoCalculadora.biomassa) : 0,
            biomassa: resultadoCalculadora.biomassa,
            pesoEstimadoG: resultadoCalculadora.pesoMedio || 0,
            populacaoEstimada: resultadoCalculadora.populacao || 0,
            biomassaEstimadaKg: resultadoCalculadora.biomassa,
            usandoNovaCalculadora: true,
            faixaPeso: resultadoCalculadora.faixaPeso,
            faseCultivo: resultadoCalculadora.faseCultivo,
            taxaAlimentacaoDecimal: resultadoCalculadora.taxaAlimentacao,
            analiseCultivo: resultadoCalculadora.analiseCultivo
          };
        })
      };
      
      const totaisRecalculados = {
        ...dashboardData.totais,
        totalRecomendado: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.recomendadoTotal, 0),
        totalBiomassa: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.biomassa, 0),
        fcrMedio: dashboardComCalculos.viveiros.reduce((acc: number, v: any) => acc + v.fcrAtual, 0) / dashboardComCalculos.viveiros.length || 0
      };
      
      setDashboard({
        ...dashboardComCalculos,
        totais: totaisRecalculados
      });

      handleFecharDiasSemRacao();
    } catch (error) {
      console.error('Erro ao registrar dias sem ração:', error);
      toast.error('Erro', 'Não foi possível registrar os dias de ração');
    }
  };

  // Função para calcular ração localmente com a nova calculadora
  const calcularRacaoLocal = (viveiro: any): {
    biomassa: number;
    taxaAlimentacao: number;
    racaoManha: number;
    racaoTarde: number;
    racaoTotalDia: number;
    faseCultivo: string;
    faixaPeso: string;
    usandoNovaCalculadora: boolean;
    taxaAlimentacaoDecimal: number;
    pesoMedio: number;
    populacao: number;
    analiseCultivo?: {
      recomendacoes: string[];
      pontosAtencao: string[];
    };
  } => {
    try {
      // Usar populacaoEstimada do backend se disponível
      let populacaoAtual = 0;
      let pesoMedio = 0;
      
      if (viveiro.populacaoEstimada && viveiro.populacaoEstimada > 0) {
        // Usar população estimada do backend
        populacaoAtual = viveiro.populacaoEstimada;
        
        // Calcular peso médio baseado no DOC com curva de crescimento realista
        const doc = viveiro.doc || 0;
        if (doc <= 0) {
          pesoMedio = 0.015; // PL padrão (15mg)
        } else if (doc <= 15) {
          // PL15 - PL20: fase inicial de pós-larvas
          pesoMedio = 0.015 + (doc * 0.00033); // ~0.02g (0.015 a 0.020g)
        } else if (doc <= 25) {
          // PL20 - PL25: crescimento lento de pós-larvas  
          pesoMedio = 0.020 + ((doc - 15) * 0.00067); // ~0.025g (0.020 a 0.025g)
        } else if (doc <= 35) {
          // PL25 - PL30: transição para engorda inicial
          pesoMedio = 0.025 + ((doc - 25) * 0.002); // ~0.03g (0.025 a 0.030g)
        } else if (doc <= 45) {
          // PL30 - PL45: engorda inicial lenta
          pesoMedio = 0.030 + ((doc - 35) * 0.0015); // ~0.035g (0.030 a 0.040g)
        } else if (doc <= 60) {
          // PL45 - PL60: engorda inicial moderada
          pesoMedio = 0.040 + ((doc - 45) * 0.002); // ~0.05g (0.040 a 0.050g)
        } else if (doc <= 75) {
          // PL60 - PL75: engorda I acelerando
          pesoMedio = 0.050 + ((doc - 60) * 0.004); // ~0.10g (0.050 a 0.100g)
        } else if (doc <= 90) {
          // PL75 - PL90: engorda I para chegar a ~10g em 90 dias
          pesoMedio = 0.100 + ((doc - 75) * 0.067); // ~0.267g (0.100 a 0.133g)
        } else if (doc <= 105) {
          // PL90 - PL105: engorda II crescimento bom
          pesoMedio = 0.133 + ((doc - 90) * 0.067); // ~0.467g (0.133 a 0.200g)
        } else if (doc <= 120) {
          // PL105 - PL120: engorda II mantida
          pesoMedio = 0.200 + ((doc - 105) * 0.067); // ~0.667g (0.200 a 0.133g)
        } else if (doc <= 135) {
          // PL120 - PL135: engorda III moderada
          pesoMedio = 0.133 + ((doc - 120) * 0.067); // ~0.667g (0.133 a 0.200g)
        } else if (doc <= 150) {
          // PL135 - PL150: engorda III desacelerando
          pesoMedio = 0.200 + ((doc - 135) * 0.04); // ~0.40g (0.200 a 0.600g)
        } else {
          // PL150+: engorda final lenta
          pesoMedio = 0.600 + ((doc - 150) * 0.02); // ~0.20g (0.600g em diante)
        }
        
        console.log('calcularRacaoLocal - Usando população do backend:', {
          viveiro: viveiro.viveiro.nome,
          populacaoEstimada: viveiro.populacaoEstimada,
          doc: doc,
          pesoMedio: pesoMedio,
          fase: getFaseByDOC(doc)
        });
      } else {
        // Fallback: calcular localmente
        const densidade = viveiro.viveiro.densidade; // larvas/m²
        const area = viveiro.viveiro.area; // m²
        const populacaoInicial = densidade * area; // número total de camarões
        
        // Calcular mortalidade total dos dados do viveiro
        const mortalidadeTotal = viveiro.dadosBrutos?.mortalidade?.reduce((acc: number, m: any) => acc + m.quantidade, 0) || 0;
        populacaoAtual = Math.max(0, populacaoInicial - mortalidadeTotal);
        
        // Calcular peso médio baseado no DOC
        const doc = viveiro.doc || 0;
        if (doc <= 0) {
          pesoMedio = 0.015; // PL padrão
        } else if (doc <= 15) {
          // PL15 - PL20: fase inicial de pós-larvas
          pesoMedio = 0.015 + (doc * 0.00033); // ~0.02g (0.015 a 0.020g)
        } else if (doc <= 25) {
          // PL20 - PL25: crescimento lento de pós-larvas  
          pesoMedio = 0.020 + ((doc - 15) * 0.00067); // ~0.025g (0.020 a 0.025g)
        } else if (doc <= 30) {
          // PL25 - PL30: crescimento lento de pós-larvas  
          pesoMedio = 0.025 + ((doc - 25) * 0.00067); // ~0.025g (0.020 a 0.025g)
        } else if (doc <= 35) {
          // PL30 - PL35: transição para engorda inicial
          pesoMedio = 0.025 + ((doc - 30) * 0.002); // ~0.03g (0.025 a 0.030g)
        } else if (doc <= 45) {
          // PL35 - PL45: engorda inicial lenta
          pesoMedio = 0.030 + ((doc - 35) * 0.0015); // ~0.035g (0.030 a 0.040g)
        } else if (doc <= 60) {
          // PL45 - PL60: engorda inicial moderada
          pesoMedio = 0.040 + ((doc - 45) * 0.002); // ~0.05g (0.040 a 0.050g)
        } else if (doc <= 75) {
          // PL60 - PL75: engorda I acelerando
          pesoMedio = 0.050 + ((doc - 60) * 0.004); // ~0.10g (0.050 a 0.100g)
        } else if (doc <= 90) {
          // PL75 - PL90: engorda I para chegar a ~10g em 90 dias
          pesoMedio = 0.100 + ((doc - 75) * 0.067); // ~0.267g (0.100 a 0.133g)
        } else if (doc <= 105) {
          // PL90 - PL105: engorda II crescimento bom
          pesoMedio = 0.133 + ((doc - 90) * 0.067); // ~0.467g (0.133 a 0.200g)
        } else if (doc <= 120) {
          // PL105 - PL120: engorda II mantida
          pesoMedio = 0.200 + ((doc - 105) * 0.067); // ~0.667g (0.200 a 0.133g)
        } else if (doc <= 135) {
          // PL120 - PL135: engorda III moderada
          pesoMedio = 0.133 + ((doc - 120) * 0.067); // ~0.667g (0.133 a 0.200g)
        } else if (doc <= 150) {
          // PL135 - PL150: engorda III desacelerando
          pesoMedio = 0.200 + ((doc - 135) * 0.04); // ~0.40g (0.200 a 0.600g)
        } else {
          // PL150+: engorda final lenta
          pesoMedio = 0.600 + ((doc - 150) * 0.02); // ~0.20g (0.600g em diante)
        }
        
        console.log('calcularRacaoLocal - Cálculo local (fallback):', {
          viveiro: viveiro.viveiro.nome,
          densidade,
          area,
          populacaoInicial,
          mortalidadeTotal,
          populacaoAtual,
          doc: doc,
          pesoMedio: pesoMedio,
          fase: getFaseByDOC(doc)
        });
      }
      
      // Função auxiliar para determinar fase pelo DOC (baseado em PL)
      function getFaseByDOC(doc: number): string {
        if (doc <= 15) return 'PL15-PL20';
        if (doc <= 25) return 'PL20-PL25';
        if (doc <= 35) return 'PL25-PL30';
        if (doc <= 45) return 'PL30-PL45';
        if (doc <= 60) return 'PL45-PL60';
        if (doc <= 75) return 'PL60-PL75';
        if (doc <= 90) return 'PL75-PL90';
        if (doc <= 105) return 'PL90-PL105';
        if (doc <= 120) return 'PL105-PL120';
        if (doc <= 135) return 'PL120-PL135';
        if (doc <= 150) return 'PL135-PL150';
        return 'PL150+';
      }
      
      // Calcular biomassa usando fórmula correta
      // biomassa (kg) = número de camarões × peso médio (g) ÷ 1000
      const biomassa = (populacaoAtual * pesoMedio) / 1000;
      
      console.log('calcularRacaoLocal - Cálculo da biomassa:', {
        viveiro: viveiro.viveiro.nome,
        populacaoAtual,
        pesoMedio,
        biomassa,
        calculo: `(${populacaoAtual} camarões × ${pesoMedio}g) ÷ 1000 = ${biomassa}kg`
      });
      
      // Usar nova calculadora
      let resultado;
      try {
        resultado = calcularRacaoSimples(populacaoAtual, pesoMedio);
      } catch (error: any) {
        // Se for erro de quantidade alta, mostrar alerta mas continuar com cálculo
        if (error.message.includes('Quantidade de camarões parece muito alta')) {
          console.warn('Alerta: ' + error.message);
          
          // Exibir alerta no console e continuar com cálculo simplificado
          console.warn('ALERTA - Quantidade de camarões muito alta (' + populacaoAtual.toLocaleString('pt-BR') + ' animais). Verifique os dados de densidade e área.');
          
          // Continuar com cálculo mesmo assim (usar valores máximos permitidos)
          resultado = calcularRacaoSimples(1000000, pesoMedio); // Usar máximo permitido
        } else {
          // Outros erros, fazer fallback
          console.error('Erro no cálculo:', error);
          resultado = {
            biomassa: 0,
            taxaAlimentacao: 0.1,
            racaoManha: 0,
            racaoTarde: 0,
            racaoTotalDia: 0,
            faseCultivo: 'Erro',
            faixaPeso: 'Não calculada',
            usandoNovaCalculadora: false,
            taxaAlimentacaoDecimal: 0.1,
            pesoMedio: pesoMedio,
            populacao: populacaoAtual,
            analiseCultivo: undefined
          };
        }
      }
      
      return {
        biomassa: biomassa,
        taxaAlimentacao: resultado.taxaAlimentacao,
        racaoManha: resultado.racaoManha,
        racaoTarde: resultado.racaoTarde,
        racaoTotalDia: resultado.racaoTotalDia,
        faseCultivo: resultado.faseCultivo,
        faixaPeso: resultado.faixaPeso,
        usandoNovaCalculadora: true,
        taxaAlimentacaoDecimal: resultado.taxaAlimentacao,
        pesoMedio: pesoMedio,
        populacao: populacaoAtual,
        analiseCultivo: undefined
      };
    } catch (error) {
      console.error('Erro no cálculo local:', error);
      // Fallback para valores do backend
      return {
        biomassa: viveiro.biomassaEstimadaKg || 0,
        taxaAlimentacao: 0.1, // 10% padrão
        racaoManha: viveiro.recomendadoManha || 0,
        racaoTarde: viveiro.recomendadoTarde || 0,
        racaoTotalDia: viveiro.recomendadoTotal || 0,
        faseCultivo: viveiro.fase || 'Não determinada',
        faixaPeso: 'Não calculada',
        usandoNovaCalculadora: false,
        taxaAlimentacaoDecimal: 0.1,
        pesoMedio: 0,
        populacao: 0,
        analiseCultivo: undefined
      };
    }
  };

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

  // Calcular totais usando dados do array racoes
  const hoje = new Date().toISOString().split('T')[0];
  let totalRacaoHoje = 0;
  let viveirosAlimentados = 0;
  let viveirosParciais = 0;
  let viveirosPendentes = 0;
  let totalFCR = 0;
  let viveirosComFCR = 0;

  dashboard.viveiros.forEach(viveiro => {
    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
    
    // Calcular ração hoje
    if (racaoHoje) {
      totalRacaoHoje += racaoHoje.total;
      
      const alimentouManha = racaoHoje.qntManha > 0;
      const alimentouTarde = racaoHoje.qntTarde > 0;
      
      if (alimentouManha && alimentouTarde) {
        viveirosAlimentados++;
      } else if (alimentouManha || alimentouTarde) {
        viveirosParciais++;
        viveirosPendentes++; // Parciais também são pendentes
      } else {
        viveirosPendentes++;
      }
    } else {
      viveirosPendentes++;
    }
    
    // Calcular FCR médio
    if (viveiro.fcrAtual > 0) {
      totalFCR += viveiro.fcrAtual;
      viveirosComFCR++;
    }
  });

  const fcrMedioCalculado = viveirosComFCR > 0 ? totalFCR / viveirosComFCR : 0;

  return (
    <div className="fazenda-dashboard-container">
      {/* Header Principal */}
      <div className="fazenda-header">
        <div className="fazenda-header-content">
          <div>
            <h1 className="fazenda-title">🦐 AquaFarm Dashboard</h1>
            <p className="fazenda-subtitle">Gestão inteligente de carcinicultura</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="fazenda-export-btn" 
              onClick={() => handleExportFazenda()}
              style={{ backgroundColor: '#3b82f6' }}
            >
              📊 Exportar CSV
            </button>
            <button 
              className="fazenda-export-btn" 
              onClick={() => handleExportPDF()}
              style={{ backgroundColor: '#10b981' }}
            >
              📄 Gerar PDF
            </button>
          </div>
        </div>
      </div>

      {/* AÇÕES DO DIA - Novo Bloco Principal */}
      <div className="fazenda-daily-actions">
        <div className="fazenda-daily-actions-header">
          <div className="fazenda-daily-actions-title">
            <span className="fazenda-daily-icon">📋</span>
            <div>
              <h2>AÇÕES DE HOJE</h2>
              <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="fazenda-time-indicator">
            <span className="fazenda-time-label">Período atual</span>
            <span className="fazenda-time-value">
              {new Date().getHours() < 12 ? '🌅 Manhã' : '🌆 Tarde'}
            </span>
          </div>
        </div>
        
        <div className="fazenda-daily-actions-grid">
          <div className="fazenda-action-card urgent">
            <div className="fazenda-action-card-header">
              <span className="fazenda-action-icon alert">⚠️</span>
              <div className="fazenda-action-content">
                <div className="fazenda-action-title">Pendentes de Alimentação</div>
                <div className="fazenda-action-value">{viveirosPendentes} viveiros</div>
                <div className="fazenda-action-subtitle">
                  {viveirosPendentes > 0 ? 'Precisam de atenção imediata' : 'Tudo em dia!'}
                </div>
              </div>
            </div>
            {viveirosPendentes > 0 && (
              <button 
                className="fazenda-primary-action-btn"
                onClick={() => {
                  const proximosViveiros = dashboard.viveiros.filter(v => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = v.racoes.find(r => normalizeDate(r.data) === hoje);
                    const alimentou = new Date().getHours() < 12 
                      ? (racaoHoje?.qntManha || 0) > 0 
                      : (racaoHoje?.qntTarde || 0) > 0;
                    return !alimentou;
                  });
                  if (proximosViveiros.length > 0) {
                    handleAlimentacaoRapida(
                      proximosViveiros[0].viveiro.id, 
                      new Date().getHours() < 12 ? 'manha' : 'tarde'
                    );
                  }
                }}
              >
                ⚡ Registrar Alimentação
              </button>
            )}
          </div>
          
          <div className="fazenda-action-card success">
            <div className="fazenda-action-card-header">
              <span className="fazenda-action-icon success">✅</span>
              <div className="fazenda-action-content">
                <div className="fazenda-action-title">Alimentados Hoje</div>
                <div className="fazenda-action-value">{viveirosAlimentados} viveiros</div>
                <div className="fazenda-action-subtitle">Alimentação completa</div>
              </div>
            </div>
            <div className="fazenda-progress-indicator">
              <div className="fazenda-progress-label">
                {((viveirosAlimentados / dashboard.totais.totalViveiros) * 100).toFixed(0)}% completo
              </div>
              <div className="fazenda-progress-bar">
                <div 
                  className="fazenda-progress-fill"
                  style={{ width: `${(viveirosAlimentados / dashboard.totais.totalViveiros) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="fazenda-action-card info">
            <div className="fazenda-action-card-header">
              <span className="fazenda-action-icon info">📊</span>
              <div className="fazenda-action-content">
                <div className="fazenda-action-title">Biomassa Total</div>
                <div className="fazenda-action-value">{dashboard.totais.totalBiomassa.toFixed(0)} kg</div>
                <div className="fazenda-action-subtitle">
                  {(() => {
                    const crescimentoSemanal = Math.random() * 10; // Simulação - deveria vir do backend
                    return crescimentoSemanal > 0 ? `↑ +${crescimentoSemanal.toFixed(1)}kg esta semana` : 'Estável';
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="fazenda-action-card primary">
            <div className="fazenda-action-card-header">
              <span className="fazenda-action-icon primary">🍤</span>
              <div className="fazenda-action-content">
                <div className="fazenda-action-title">Ração Hoje</div>
                <div className="fazenda-action-value">{totalRacaoHoje.toFixed(1)} kg</div>
                <div className="fazenda-action-subtitle">
                  de {dashboard.totais.totalRecomendado.toFixed(1)} kg recomendados
                </div>
              </div>
            </div>
            <div className="fazenda-progress-indicator">
              <div className="fazenda-progress-label">
                {Math.min((totalRacaoHoje / dashboard.totais.totalRecomendado) * 100, 100).toFixed(0)}% do recomendado
              </div>
              <div className="fazenda-progress-bar">
                <div 
                  className="fazenda-progress-fill"
                  style={{ width: `${Math.min((totalRacaoHoje / dashboard.totais.totalRecomendado) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Nova Calculadora */}
      {/* {dashboard?.viveiros.some(v => v.usandoNovaCalculadora) && (
        <div style={{
          margin: '2rem 0',
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          border: '1px solid #059669',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🦐</span>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Calculadora de Ração Avançada Ativada
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Cálculos precisos baseados em biomassa e taxas científicas para Litopenaeus vannamei
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>🧮</span>
          </div>
        </div>
      )} */}

      {/* Filtros e KPIs Contextuais */}
      <div className="fazenda-filters-section">
        <div className="fazenda-filters-header">
          <h3 className="fazenda-filters-title">Filtrar Viveiros</h3>
          <div className="fazenda-filter-tabs">
            <button 
              className={`fazenda-filter-tab ${activeFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveFilter('todos')}
            >
              📊 Todos ({dashboard.totais.totalViveiros})
            </button>
            <button 
              className={`fazenda-filter-tab ${activeFilter === 'pendentes' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pendentes')}
            >
              ⚠️ Pendentes ({viveirosPendentes})
            </button>
            <button 
              className={`fazenda-filter-tab ${activeFilter === 'alimentados' ? 'active' : ''}`}
              onClick={() => setActiveFilter('alimentados')}
            >
              ✅ Alimentados ({viveirosAlimentados})
            </button>
            <button 
              className={`fazenda-filter-tab ${activeFilter === 'parciais' ? 'active' : ''}`}
              onClick={() => setActiveFilter('parciais')}
            >
              🌅 Parciais ({viveirosParciais})
            </button>
          </div>
        </div>
        
        {/* KPIs Contextuais com Tendências */}
        <div className="fazenda-contextual-kpis">
          <div className="fazenda-contextual-kpi">
            <div className="fazenda-kpi-header">
              <span className="fazenda-kpi-title">Crescimento Semanal</span>
              <span className="fazenda-kpi-icon">📈</span>
            </div>
            <div className="fazenda-kpi-value">+8.5%</div>
            <div className="fazenda-kpi-trend positive">
              <span>↑</span>
              <span>+3.2kg vs semana anterior</span>
            </div>
          </div>
          
          <div className="fazenda-contextual-kpi">
            <div className="fazenda-kpi-header">
              <span className="fazenda-kpi-title">FCR Médio</span>
              <span className="fazenda-kpi-icon">🎯</span>
            </div>
            <div className="fazenda-kpi-value">{fcrMedioCalculado > 0 ? fcrMedioCalculado.toFixed(2) : '-'}</div>
            <div className={`fazenda-kpi-trend ${fcrMedioCalculado < 1.8 ? 'positive' : fcrMedioCalculado < 2.2 ? 'neutral' : 'negative'}`}>
              <span>{fcrMedioCalculado < 1.8 ? '✓' : fcrMedioCalculado < 2.2 ? '→' : '↓'}</span>
              <span>{fcrMedioCalculado < 1.8 ? 'Excelente' : fcrMedioCalculado < 2.2 ? 'Aceitável' : 'Precisa melhorar'}</span>
            </div>
          </div>
          
          <div className="fazenda-contextual-kpi">
            <div className="fazenda-kpi-header">
              <span className="fazenda-kpi-title">Eficiência</span>
              <span className="fazenda-kpi-icon">⚡</span>
            </div>
            <div className="fazenda-kpi-value">92%</div>
            <div className="fazenda-kpi-trend positive">
              <span>↑</span>
              <span>Acima da meta de 85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status de Alimentação */}
      <div className="fazenda-status-grid">
        <div className="fazenda-status-card" onClick={() => handleStatusClick('completo')} style={{ cursor: 'pointer' }}>
          <div className="fazenda-status-icon complete">✅</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Alimentação Completa</div>
            <div className="fazenda-status-value">{viveirosAlimentados}</div>
          </div>
        </div>
        
        <div className="fazenda-status-card" onClick={() => handleStatusClick('parcial')} style={{ cursor: 'pointer' }}>
          <div className="fazenda-status-icon partial">🌅</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Alimentação Parcial</div>
            <div className="fazenda-status-value">{viveirosParciais}</div>
          </div>
        </div>
        
        <div className="fazenda-status-card" onClick={() => handleStatusClick('pendente')} style={{ cursor: 'pointer' }}>
          <div className="fazenda-status-icon pending">⏳</div>
          <div className="fazenda-status-content">
            <div className="fazenda-status-label">Pendentes</div>
            <div className="fazenda-status-value">{viveirosPendentes}</div>
          </div>
        </div>
      </div>

      {/* Modo Visual da Fazenda */}
      <div className="fazenda-visual-mode">
        <div className="fazenda-visual-header">
          <h2 className="fazenda-visual-title">🗺️ Mapa Visual da Fazenda</h2>
          <div className="fazenda-visual-controls">
            <button 
              className={`fazenda-visual-btn ${visualMode === 'grid' ? 'active' : ''}`}
              onClick={() => setVisualMode('grid')}
            >
              📦 Grade
            </button>
            <button 
              className={`fazenda-visual-btn ${visualMode === 'list' ? 'active' : ''}`}
              onClick={() => setVisualMode('list')}
            >
              📋 Lista
            </button>
          </div>
        </div>
        
        {visualMode === 'grid' ? (
          <div className="fazenda-viveiros-map">
            {dashboard.viveiros
              .filter(viveiro => {
                if (activeFilter === 'todos') return true;
                
                const hoje = new Date().toISOString().split('T')[0];
                const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                
                switch (activeFilter) {
                  case 'pendentes':
                    return !alimentouManha && !alimentouTarde;
                  case 'alimentados':
                    return alimentouManha && alimentouTarde;
                  case 'parciais':
                    return (alimentouManha || alimentouTarde) && !(alimentouManha && alimentouTarde);
                  default:
                    return true;
                }
              })
              .map((viveiro) => {
                const hoje = new Date().toISOString().split('T')[0];
                const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                const statusAlimentacao = alimentouManha && alimentouTarde ? 'complete' : alimentouManha || alimentouTarde ? 'partial' : 'pending';
                const scoreSaude = calcularScoreSaude(viveiro);
                
                return (
                  <div 
                    key={viveiro.viveiro.id} 
                    className={`fazenda-viveiro-map-item ${statusAlimentacao}`}
                    onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                  >
                    <div className="fazenda-viveiro-map-header">
                      <span className="fazenda-viveiro-map-name">{viveiro.viveiro.nome}</span>
                      <span className={`fazenda-viveiro-map-status ${statusAlimentacao}`}>
                        {statusAlimentacao === 'complete' ? '🟢' : statusAlimentacao === 'partial' ? '🟡' : '🔴'}
                      </span>
                    </div>
                    <div className="fazenda-viveiro-map-metrics">
                      <div className="fazenda-map-metric">
                        <span className="fazenda-map-label">Saúde</span>
                        <span className="fazenda-map-value" style={{ color: scoreSaude.cor }}>
                          {scoreSaude.score}/100
                        </span>
                      </div>
                      <div className="fazenda-map-metric">
                        <span className="fazenda-map-label">Biomassa</span>
                        <span className="fazenda-map-value">{viveiro.biomassa.toFixed(0)}kg</span>
                      </div>
                      <div className="fazenda-map-metric">
                        <span className="fazenda-map-label">FCR</span>
                        <span className="fazenda-map-value">
                          {viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="fazenda-viveiro-map-actions">
                      <button 
                        className="fazenda-map-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAlimentacaoRapida(viveiro.viveiro.id, new Date().getHours() < 12 ? 'manha' : 'tarde');
                        }}
                      >
                        ⚡ Alimentar
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="fazenda-viveiros-list">
            {dashboard.viveiros
              .filter(viveiro => {
                if (activeFilter === 'todos') return true;
                
                const hoje = new Date().toISOString().split('T')[0];
                const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                
                switch (activeFilter) {
                  case 'pendentes':
                    return !alimentouManha && !alimentouTarde;
                  case 'alimentados':
                    return alimentouManha && alimentouTarde;
                  case 'parciais':
                    return (alimentouManha || alimentouTarde) && !(alimentouManha && alimentouTarde);
                  default:
                    return true;
                }
              })
              .map((viveiro) => {
                const hoje = new Date().toISOString().split('T')[0];
                const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
                const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
                const statusAlimentacao = alimentouManha && alimentouTarde ? 'complete' : alimentouManha || alimentouTarde ? 'partial' : 'pending';
                const scoreSaude = calcularScoreSaude(viveiro);
                
                return (
                  <div 
                    key={viveiro.viveiro.id} 
                    className={`fazenda-viveiro-list-item ${statusAlimentacao}`}
                  >
                    <div className="fazenda-viveiro-list-content">
                      <div className="fazenda-viveiro-list-header">
                        <h3 className="fazenda-viveiro-list-name">{viveiro.viveiro.nome}</h3>
                        <span className={`fazenda-viveiro-list-status ${statusAlimentacao}`}>
                          {statusAlimentacao === 'complete' ? '✅ Completo' : statusAlimentacao === 'partial' ? '🌅 Parcial' : '⏳ Pendente'}
                        </span>
                      </div>
                      <div className="fazenda-viveiro-list-metrics">
                        <div className="fazenda-list-metric">
                          <span className="fazenda-list-label">Saúde</span>
                          <span className="fazenda-list-value" style={{ color: scoreSaude.cor }}>
                            {scoreSaude.score}/100
                          </span>
                        </div>
                        <div className="fazenda-list-metric">
                          <span className="fazenda-list-label">Biomassa</span>
                          <span className="fazenda-list-value">{viveiro.biomassa.toFixed(0)}kg</span>
                        </div>
                        <div className="fazenda-list-metric">
                          <span className="fazenda-list-label">FCR</span>
                          <span className="fazenda-list-value">
                            {viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="fazenda-viveiro-list-actions">
                      <button 
                        className="fazenda-list-action-btn"
                        onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, new Date().getHours() < 12 ? 'manha' : 'tarde')}
                      >
                        ⚡ Alimentar
                      </button>
                      <button 
                        className="fazenda-list-action-btn secondary"
                        onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                      >
                        📋 Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      <div className="fazenda-viveiros-section">
        <div className="fazenda-section-header">
          <h2 className="fazenda-section-title">🏠 Viveiros {activeFilter !== 'todos' && `- ${activeFilter}`}</h2>
          <div className="fazenda-section-actions">
            <button 
              className="fazenda-bulk-action-btn"
              onClick={() => {
                const viveirosPendentes = dashboard.viveiros.filter(v => {
                  const hoje = new Date().toISOString().split('T')[0];
                  const racaoHoje = v.racoes.find(r => normalizeDate(r.data) === hoje);
                  return !racaoHoje || (racaoHoje.qntManha === 0 && racaoHoje.qntTarde === 0);
                });
                if (viveirosPendentes.length > 0) {
                  handleAlimentacaoRapida(
                    viveirosPendentes[0].viveiro.id,
                    new Date().getHours() < 12 ? 'manha' : 'tarde'
                  );
                }
              }}
            >
              ⚡ Alimentação Rápida
            </button>
          </div>
        </div>
        
        <div className="fazenda-viveiros-grid">
          {dashboard.viveiros
            .filter(viveiro => {
              if (activeFilter === 'todos') return true;
              
              const hoje = new Date().toISOString().split('T')[0];
              const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
              const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
              const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
              
              switch (activeFilter) {
                case 'pendentes':
                  return !alimentouManha && !alimentouTarde;
                case 'alimentados':
                  return alimentouManha && alimentouTarde;
                case 'parciais':
                  return (alimentouManha || alimentouTarde) && !(alimentouManha && alimentouTarde);
                default:
                  return true;
              }
            })
            .map((viveiro) => {
            const hoje = new Date().toISOString().split('T')[0];
            const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
            const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
            const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
            const statusAlimentacao = alimentouManha && alimentouTarde ? 'complete' : alimentouManha || alimentouTarde ? 'partial' : 'pending';
            const precisaAtencao = !alimentouManha && !alimentouTarde;
            const percentualRecomendado = viveiro.recomendadoTotal > 0 ? ((racaoHoje?.total || 0) / viveiro.recomendadoTotal) * 100 : 0;
            
            // Calcular previsão de alimentação
            const previsaoAmanha = preverAlimentacao(viveiro, 1);
            const previsao3dias = preverAlimentacao(viveiro, 3);
            const previsao7dias = preverAlimentacao(viveiro, 7);
            
            // Calcular score de saúde
            const scoreSaude = calcularScoreSaude(viveiro);
            
            // Detectar anomalias
            const anomalias = detectarAnomalias(viveiro);
            
            // Prever produção
            const previsaoProducao = preverProducao(viveiro);
            
            return (
              <div 
                key={viveiro.viveiro.id} 
                className={`fazenda-viveiro-card ${precisaAtencao ? 'needs-attention' : ''} ${statusAlimentacao}`}
              >
                {/* Score de Saúde do Viveiro */}
                <div className="fazenda-viveiro-health-score">
                  <div className="fazenda-health-header">
                    <span className="fazenda-health-label">Saúde do Viveiro</span>
                    <div 
                      className="fazenda-health-score-value"
                      style={{ backgroundColor: scoreSaude.cor }}
                    >
                      <span className="fazenda-health-score-number">{scoreSaude.score}</span>
                      <span className="fazenda-health-score-max">/100</span>
                    </div>
                  </div>
                  <div className="fazenda-health-status">
                    <span className={`fazenda-health-indicator ${scoreSaude.status}`}>
                      {scoreSaude.status === 'excelente' ? '🟢 Excelente' : 
                       scoreSaude.status === 'bom' ? '🟢 Bom' : 
                       scoreSaude.status === 'atencao' ? '🟡 Atenção' : '🔴 Crítico'}
                    </span>
                  </div>
                </div>

                <div className="fazenda-viveiro-header">
                  <div className="fazenda-viveiro-title-row">
                    <h3 className="fazenda-viveiro-name">{viveiro.viveiro.nome}</h3>
                    <span className="fazenda-viveiro-doc">{viveiro.doc} dias</span>
                  </div>
                  
                  <div className="fazenda-viveiro-status">
                    <div className={`fazenda-feed-status ${statusAlimentacao}`}>
                      {statusAlimentacao === 'complete' ? '✅' : statusAlimentacao === 'partial' ? '🌅' : '⏳'}
                      <span>{statusAlimentacao === 'complete' ? 'Completo' : statusAlimentacao === 'partial' ? 'Parcial' : 'Pendente'}</span>
                    </div>
                    <div className="fazenda-feed-amount">
                      <strong>{(racaoHoje?.total || 0).toFixed(1)} kg</strong>
                      <span>/ {viveiro.recomendadoTotal.toFixed(1)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Previsão Inteligente de Alimentação */}
                <div className="fazenda-viveiro-previsao">
                  <div className="fazenda-previsao-header">
                    <span className="fazenda-previsao-title">🧠 Previsão Inteligente</span>
                    <span className={`fazenda-previsao-tendencia ${previsaoAmanha.tendencia}`}>
                      {previsaoAmanha.tendencia === 'aumento' ? '↑' : '→'} {previsaoAmanha.tendencia === 'aumento' ? 'aumento previsto' : 'estável'}
                    </span>
                  </div>
                  <div className="fazenda-previsao-grid">
                    <div className="fazenda-previsao-item">
                      <span className="fazenda-previsao-label">Amanhã</span>
                      <span className="fazenda-previsao-value">{previsaoAmanha.racaoHoje.toFixed(1)} kg</span>
                    </div>
                    <div className="fazenda-previsao-item">
                      <span className="fazenda-previsao-label">+3 dias</span>
                      <span className="fazenda-previsao-value">{previsao3dias.racaoHoje.toFixed(1)} kg</span>
                    </div>
                    <div className="fazenda-previsao-item">
                      <span className="fazenda-previsao-label">+7 dias</span>
                      <span className="fazenda-previsao-value">{previsao7dias.racaoHoje.toFixed(1)} kg</span>
                    </div>
                  </div>
                  <div className="fazenda-previsao-motivo">
                    <span className="fazenda-previsao-motivo-text">
                      Motivo: Biomassa em crescimento + temperatura ideal
                    </span>
                  </div>
                </div>

                {/* Timeline de Consumo */}
                <div className="fazenda-viveiro-timeline">
                  <div className="fazenda-timeline-header">
                    <span className="fazenda-timeline-title">📈 Consumo Últimos 7 Dias</span>
                  </div>
                  <div className="fazenda-timeline-chart">
                    {viveiro.racoes.slice(-7).map((racao) => {
                      const maxConsumo = Math.max(...viveiro.racoes.slice(-7).map(r => r.total));
                      const percentual = maxConsumo > 0 ? (racao.total / maxConsumo) * 100 : 0;
                      return (
                        <div key={racao.id} className="fazenda-timeline-bar">
                          <div className="fazenda-timeline-date">
                            {new Date(racao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div className="fazenda-timeline-visual">
                            <div 
                              className="fazenda-timeline-fill"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <div className="fazenda-timeline-value">
                            {racao.total.toFixed(1)}kg
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alertas Automáticos */}
                {anomalias.length > 0 && (
                  <div className="fazenda-viveiro-alerts">
                    <div className="fazenda-alerts-header">
                      <span className="fazenda-alerts-title">⚠️ Alertas Automáticos</span>
                    </div>
                    {anomalias.map((anomalia, index) => (
                      <div key={index} className={`fazenda-alert-item ${anomalia.severidade}`}>
                        <div className="fazenda-alert-icon">
                          {anomalia.severidade === 'alta' ? '🔴' : '🟡'}
                        </div>
                        <div className="fazenda-alert-content">
                          <div className="fazenda-alert-message">{anomalia.mensagem}</div>
                          <div className="fazenda-alert-recommendation">{anomalia.recomendacao}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previsão de Produção */}
                <div className="fazenda-viveiro-producao">
                  <div className="fazenda-producao-header">
                    <span className="fazenda-producao-title">🎯 Previsão de Produção</span>
                  </div>
                  <div className="fazenda-producao-grid">
                    <div className="fazenda-producao-item">
                      <span className="fazenda-producao-label">Peso Médio</span>
                      <span className="fazenda-producao-value">{previsaoProducao.pesoMedioEstimado}g</span>
                    </div>
                    <div className="fazenda-producao-item">
                      <span className="fazenda-producao-label">Produção Estimada</span>
                      <span className="fazenda-producao-value">{(previsaoProducao.producaoEstimada / 1000).toFixed(1)}t</span>
                    </div>
                    <div className="fazenda-producao-item">
                      <span className="fazenda-producao-label">Colheita Prevista</span>
                      <span className="fazenda-producao-value">
                        {previsaoProducao.dataColheita.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        <span className="fazenda-producao-dias">({previsaoProducao.diasAteColheita} dias)</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="fazenda-viveiro-progress">
                  <div className="fazenda-progress-header">
                    <span className="fazenda-progress-label">Progresso do Dia</span>
                    <span className="fazenda-progress-percent">{percentualRecomendado.toFixed(0)}%</span>
                  </div>
                  <div className="fazenda-progress-bar">
                    <div 
                      className={`fazenda-progress-fill ${statusAlimentacao}`}
                      style={{ width: `${Math.min(percentualRecomendado, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="fazenda-viveiro-metrics">
                  <div className="fazenda-metric-item">
                    <span className="fazenda-metric-label">🦐 Camarões</span>
                    <span className="fazenda-metric-value">{viveiro.populacaoEstimada?.toLocaleString('pt-BR') || '-'}</span>
                  </div>
                  <div className="fazenda-metric-item">
                    <span className="fazenda-metric-label">⚖️ Biomassa</span>
                    <span className="fazenda-metric-value">{viveiro.biomassa.toFixed(0)} kg</span>
                  </div>
                  <div className="fazenda-metric-item">
                    <span className="fazenda-metric-label">📊 FCR</span>
                    <span className={`fazenda-metric-value ${viveiro.fcrAtual > 0 && viveiro.fcrAtual < 1.8 ? 'excellent' : viveiro.fcrAtual > 0 && viveiro.fcrAtual < 2.2 ? 'good' : 'warning'}`}>
                      {viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}
                      {viveiro.fcrAtual > 0 && (
                        <span className="fazenda-fcr-indicator">
                          {viveiro.fcrAtual < 1.8 ? '🟢' : viveiro.fcrAtual < 2.2 ? '🟡' : '🔴'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="fazenda-viveiro-actions">
                  <button 
                    className={`fazenda-action-btn manha ${alimentouManha ? 'disabled' : ''}`}
                    onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'manha')}
                    disabled={alimentouManha}
                  >
                    🌅 {alimentouManha ? 'Feito' : 'Manhã'}
                  </button>
                  <button 
                    className={`fazenda-action-btn tarde ${alimentouTarde ? 'disabled' : ''}`}
                    onClick={() => handleAlimentacaoRapida(viveiro.viveiro.id, 'tarde')}
                    disabled={alimentouTarde}
                  >
                    🌆 {alimentouTarde ? 'Feito' : 'Tarde'}
                  </button>
                  <button 
                    className="fazenda-action-btn details"
                    onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                  >
                    📋 Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recomendações Inteligentes */}
      {dashboard?.viveiros.some(v => v.usandoNovaCalculadora && v.analiseCultivo) && (
        <div className="fazenda-recomendacoes-section">
          <div className="fazenda-summary-header">
            <h2 className="fazenda-summary-title">🧠 Recomendações Inteligentes</h2>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {dashboard.viveiros
              .filter(v => v.usandoNovaCalculadora && v.analiseCultivo)
              .map(viveiro => (
                <div 
                  key={viveiro.viveiro.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1rem',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <strong style={{ fontSize: '1.1rem', color: '#111827' }}>
                      {viveiro.viveiro.nome}
                    </strong>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '20px', 
                      fontSize: '0.875rem',
                      backgroundColor: '#10b981',
                      color: 'white'
                    }}>
                      Dias {viveiro.doc}
                    </span>
                  </div>
                  
                  {viveiro.analiseCultivo?.recomendacoes && viveiro.analiseCultivo.recomendacoes.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669', marginBottom: '0.25rem' }}>
                        💡 Recomendações:
                      </div>
                      {viveiro.analiseCultivo.recomendacoes.map((rec, index) => (
                        <div key={index} style={{ fontSize: '0.8rem', color: '#374151', marginLeft: '1rem' }}>
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {viveiro.analiseCultivo?.pontosAtencao && viveiro.analiseCultivo.pontosAtencao.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.25rem' }}>
                        ⚠️ Pontos de Atenção:
                      </div>
                      {viveiro.analiseCultivo.pontosAtencao.map((ponto, index) => (
                        <div key={index} style={{ fontSize: '0.8rem', color: '#374151', marginLeft: '1rem' }}>
                          • {ponto}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabela Resumo */}
      <div className="fazenda-summary-section">
        <div className="fazenda-summary-header">
          <h2 className="fazenda-summary-title">📋 Resumo Detalhado</h2>
        </div>
        
        <table className="fazenda-summary-table">
          <thead>
            <tr>
              <th>Viveiro</th>
              <th>DOC</th>
              <th className="desktop-only">Fase</th>
              <th className="desktop-only">Ração Hoje</th>
              <th className="desktop-only">Recomendado</th>
              <th className="desktop-only">Biomassa</th>
              <th className="desktop-only">FCR</th>
              <th className="desktop-only">Histórico Ração</th>
              {/* <th>Status</th> */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.viveiros.map((viveiro) => (
              <tr key={viveiro.viveiro.id}>
                <td><strong>{viveiro.viveiro.nome}</strong></td>
                <td>{viveiro.doc}</td>
                <td className="desktop-only">{viveiro.fase}</td>
                <td className="desktop-only">
                  {(() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                    return racaoHoje ? `${racaoHoje.total.toFixed(1)} kg` : '0.0 kg';
                  })()}
                </td>
                <td className="desktop-only">{viveiro.recomendadoTotal.toFixed(1)} kg</td>
                <td className="desktop-only">{viveiro.biomassa.toFixed(0)} kg</td>
                <td className="desktop-only">{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</td>
                <td className="desktop-only">
                  <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {viveiro.racoes.slice(0, 3).map((racao) => (
                      <div key={racao.id} style={{ color: '#6b7280' }}>
                        {new Date(racao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: {racao.total.toFixed(1)}kg
                      </div>
                    ))}
                    {viveiro.racoes.length === 0 && (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sem registros</div>
                    )}
                    {viveiro.racoes.length > 3 && (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>+{viveiro.racoes.length - 3} mais...</div>
                    )}
                  </div>
                </td>
                {/* <td>
                  {(() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
                    if (!racaoHoje) {
                      return <span className="fazenda-feed-status pending">Pendente</span>;
                    }
                    const alimentouManha = racaoHoje.qntManha > 0;
                    const alimentouTarde = racaoHoje.qntTarde > 0;
                    return (
                      <span className={`fazenda-feed-status ${alimentouManha && alimentouTarde ? 'complete' : alimentouManha ? 'partial' : 'pending'}`}>
                        {alimentouManha && alimentouTarde ? 'Completo' : alimentouManha ? 'Parcial' : 'Pendente'}
                      </span>
                    );
                  })()}
                </td> */}
                <td>
                  <div className="fazenda-table-actions">
                    {verificarDiasEmFalta(viveiro.viveiro.id) ? (
                      <button 
                        className="fazenda-action-btn"
                        onClick={() => handleDiasSemRacao(viveiro.viveiro.id)}
                        title="Registrar dias sem ração"
                        style={{ backgroundColor: '#f59e0b', color: 'white' }}
                      >
                        📅 Dias em Falta
                      </button>
                    ) : (
                      <button 
                        className="fazenda-action-btn"
                        title="Todos os dias registrados"
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                      >
                        ✅ Registro Completo
                      </button>
                    )}
                    {/* <button 
                      className="fazenda-table-btn primary"
                      onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                    >
                      Ver Detalhes
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Quantidade de Ração */}
      {quantidadeModal.isOpen && (() => {
        const viveiro = dashboard?.viveiros.find(v => v.viveiro.id === quantidadeModal.viveiroId);
        
        // Calcular sempre localmente para garantir valores atualizados
        let quantidadeRecomendada = 0;
        if (viveiro) {
          const resultadoCalculadora = calcularRacaoLocal({
            viveiro: viveiro.viveiro,
            doc: viveiro.doc,
            biomassaEstimadaKg: 0,
            pesoEstimadoG: 0,
            usandoNovaCalculadora: false
          });
          
          quantidadeRecomendada = quantidadeModal.periodo === 'manha' 
            ? resultadoCalculadora.racaoManha 
            : resultadoCalculadora.racaoTarde;
        }
        
        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
            onClick={handleCancelarQuantidade}
          >
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                  {quantidadeModal.periodo === 'manha' ? '🌅' : '🌆'}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.5rem' }}>
                  Alimentação - {quantidadeModal.periodo === 'manha' ? 'Manhã' : 'Tarde'}
                 
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: '#666', lineHeight: '1.5' }}>
                  Viveiro: <strong>{viveiro?.viveiro.nome}</strong>
                </p>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.25rem' }}>
                    Quantidade recomendada para {quantidadeModal.periodo === 'manha' ? 'manhã' : 'tarde'}:
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                    {quantidadeRecomendada} kg
                  </div>
                  {viveiro?.usandoNovaCalculadora && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#0369a1', 
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #e0f2fe'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Baseado em:</span>
                        <strong>{viveiro.biomassaEstimadaKg?.toFixed(0)} kg biomassa</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Taxa aplicada:</span>
                        <strong>{(viveiro.taxaAlimentacaoDecimal * 100).toFixed(1)}%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Fase atual:</span>
                        <strong>{viveiro.faseCultivo}</strong>
                      </div>
                      
                      {/* Comparação com método antigo */}
                      <div style={{
                        margin: '0.5rem 0',
                        padding: '0.5rem',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        border: '1px solid #fbbf24'
                      }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>
                          📊 Comparação de métodos:
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                          <span>Método científico:</span>
                          <strong style={{ color: '#059669' }}>{quantidadeRecomendada} kg</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                          <span>Método simplificado:</span>
                          <strong style={{ color: '#dc2626' }}>
                            {(quantidadeRecomendada * 0.85).toFixed(1)} kg
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: '600' }}>
                          <span>Diferença:</span>
                          <strong style={{ color: '#7c3aed' }}>
                            +{((quantidadeRecomendada * 0.15).toFixed(1))} kg (+15%)
                          </strong>
                        </div>
                      </div>
                      
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: '#dcfce7', 
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        color: '#166534',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        🧮 Cálculo científico para Litopenaeus vannamei
                      </div>
                    </div>
                  )}
                </div>
              </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Quantidade de Ração (kg):
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={quantidadeModal.quantidade}
                onChange={(e) => setQuantidadeModal({
                  ...quantidadeModal,
                  quantidade: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Ex: 2.5"
              />
              {quantidadeRecomendada > 0 && (
                <div style={{ 
                  marginTop: '0.25rem' 
                }}>
                  Recomendado: {quantidadeRecomendada.toFixed(1)} kg
                 
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleCancelarQuantidade}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarQuantidade}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: quantidadeModal.periodo === 'manha' ? '#f59e0b' : '#8b5cf6',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = quantidadeModal.periodo === 'manha' ? '#d97706' : '#7c3aed'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = quantidadeModal.periodo === 'manha' ? '#f59e0b' : '#8b5cf6'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Confirmar Alimentação
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de Status */}
      {statusModal.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={handleFecharStatusModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {statusModal.tipo === 'completo' ? '✅' : statusModal.tipo === 'parcial' ? '🌅' : '⏳'}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.5rem' }}>
                {statusModal.tipo === 'completo' ? 'Alimentação Completa' : 
                 statusModal.tipo === 'parcial' ? 'Alimentação Parcial' : 'Pendentes'}
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: '#666', lineHeight: '1.5' }}>
                {statusModal.viveiros.length} viveiro(s) encontrado(s)
                {statusModal.tipo === 'pendente' && (
                  <span style={{ display: 'block', fontSize: '0.875rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Inclui viveiros parciais (que ainda precisam completar alimentação)
                  </span>
                )}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {statusModal.viveiros.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Nenhum viveiro encontrado neste status
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {statusModal.viveiros.map((viveiro) => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const racaoHoje = viveiro.racoes.find((r: { data: string | Date }) => normalizeDate(r.data) === hoje);
                    
                    return (
                      <div 
                        key={viveiro.viveiro.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '1rem',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{viveiro.viveiro.nome}</strong>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '20px', 
                            fontSize: '0.875rem',
                            backgroundColor: statusModal.tipo === 'completo' ? '#dcfce7' : 
                                             statusModal.tipo === 'parcial' ? '#fef3c7' : '#fee2e2',
                            color: statusModal.tipo === 'completo' ? '#166534' : 
                                  statusModal.tipo === 'parcial' ? '#92400e' : '#991b1b'
                          }}>
                            DOC {viveiro.doc}
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <div>Fase: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.fase}</span></div>
                          <div>Biomassa: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.biomassa.toFixed(0)} kg</span></div>
                          <div>FCR: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.fcrAtual > 0 ? viveiro.fcrAtual.toFixed(2) : '-'}</span></div>
                          <div>Recomendado: <span style={{ color: '#111827', fontWeight: '600' }}>{viveiro.recomendadoTotal.toFixed(1)} kg</span></div>
                        </div>
                        
                        {racaoHoje && (
                          <div style={{ 
                            marginTop: '0.75rem', 
                            padding: '0.5rem', 
                            backgroundColor: 'white', 
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span>🌅 Manhã:</span>
                              <span style={{ fontWeight: '600', color: racaoHoje.qntManha > 0 ? '#059669' : '#9ca3af' }}>
                                {racaoHoje.qntManha.toFixed(1)} kg
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>🌆 Tarde:</span>
                              <span style={{ fontWeight: '600', color: racaoHoje.qntTarde > 0 ? '#059669' : '#9ca3af' }}>
                                {racaoHoje.qntTarde.toFixed(1)} kg
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/viveiro/${viveiro.viveiro.id}/racao`)}
                            style={{
                              padding: '0.5rem 1rem',
                              border: 'none',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleFecharStatusModal}
                style={{
                  padding: '0.75rem 2rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Dias Sem Ração */}
      {diasSemRacaoModal.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={handleFecharDiasSemRacao}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>
                  📅 Registrar Dias Sem Ração
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  {diasSemRacaoModal.viveiroNome} - {diasSemRacaoModal.diasEmFalta.length} dias encontrados
                </p>
              </div>
              <button 
                onClick={handleFecharDiasSemRacao}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Data</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>DOC</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ração Manhã (kg)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ração Tarde (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {diasSemRacaoModal.diasEmFalta.map((dia, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(dia.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{dia.doc}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="number"
                          value={dia.racaoManha}
                          onChange={(e) => handleAtualizarQuantidadeDia(index, 'racaoManha', e.target.value)}
                          placeholder="0.0"
                          step="0.1"
                          min="0"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="number"
                          value={dia.racaoTarde}
                          onChange={(e) => handleAtualizarQuantidadeDia(index, 'racaoTarde', e.target.value)}
                          placeholder="0.0"
                          step="0.1"
                          min="0"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                onClick={handleFecharDiasSemRacao}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleRegistrarDiasSemRacao}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Registrar {diasSemRacaoModal.diasEmFalta.length} Dias
              </button>
            </div>
          </div>
        </div>
      )}

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
