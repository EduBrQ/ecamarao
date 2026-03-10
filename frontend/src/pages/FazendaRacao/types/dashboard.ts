export interface ViveiroDashboard {
  viveiro: {
    id: number;
    nome: string;
    densidade: number;
    area: number;
    data_inicio_ciclo: string;
    status: string;
  };
  doc: number;
  racaoHojeTotal: number;
  racaoHojeManha: number;
  racaoHojeTarde: number;
  recomendadoTotal: number;
  recomendadoManha: number;
  recomendadoTarde: number;
  fase: string;
  fcrAtual: number;
  racaoAcumulada: number;
  biomassa: number;
  alimentouManha: boolean;
  alimentouTarde: boolean;
  pesoEstimadoG: number;
  populacaoEstimada: number;
  biomassaEstimadaKg: number;
  usandoPesoReal: boolean;
  usandoNovaCalculadora: boolean;
  faixaPeso: string;
  faseCultivo: string;
  taxaAlimentacaoDecimal: number;
  analiseCultivo?: {
    recomendacoes: string[];
    pontosAtencao: string[];
  };
  racoes: Array<{
    id: number;
    data: string;
    qntManha: number;
    qntTarde: number;
    total: number;
  }>;
}

export interface TotaisFazenda {
  totalViveiros: number;
  totalRacaoHoje: number;
  totalRecomendado: number;
  totalBiomassa: number;
  totalRacaoAcumulada: number;
  fcrMedio: number;
  viveirosAlimentados: number;
  viveirosParciais: number;
  viveirosPendentes: number;
}

export interface DashboardResponse {
  viveiros: ViveiroDashboard[];
  totais: TotaisFazenda;
  atualizado: string;
}

export interface HealthScore {
  score: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  cor: string;
  fatores: {
    fcr: number;
    crescimento: number;
    consistencia: number;
    sobrevivencia: number;
  };
}

export interface Anomalia {
  tipo: string;
  severidade: 'baixa' | 'media' | 'alta';
  mensagem: string;
  recomendacao: string;
}

export interface ProductionForecast {
  pesoMedioEstimado: number;
  producaoEstimada: number;
  dataColheita: Date;
  diasAteColheita: number;
}

export interface FeedPrediction {
  racaoHoje: number;
  biomassaFutura: number;
  crescimentoPercentual: number;
  tendencia: 'aumento' | 'estavel';
}

export type FeedingStatus = 'complete' | 'partial' | 'pending';
export type VisualMode = 'grid' | 'list';
export type FilterType = 'todos' | 'pendentes' | 'alimentados' | 'parciais';
