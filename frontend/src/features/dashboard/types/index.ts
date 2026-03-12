export interface DashboardResponse {
  viveiros: import('../../viveiros/types').ViveiroDashboard[];
  totais: TotaisFazenda;
  atualizado: string;
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

export interface FarmEvent {
  id: string;
  tipo: 'alimentacao' | 'alerta' | 'completou';
  horario: string;
  mensagem: string;
  detalhes?: string;
  severidade?: 'baixa' | 'media' | 'alta';
}

export interface FarmStatus {
  saudeGeral: number;
  biomassaTotal: number;
  racaoHoje: number;
  recomendadoHoje: number;
  alertasAtivos: number;
}

export type FilterType = 'todos' | 'pendentes' | 'alimentados' | 'parciais';
export type VisualMode = 'grid' | 'list';
