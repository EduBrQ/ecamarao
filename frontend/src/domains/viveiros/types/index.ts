export interface Viveiro {
  id: number;
  nome: string;
  densidade: number;
  area: number;
  data_inicio_ciclo: string;
  status: string;
}

export interface ViveiroDashboard {
  viveiro: Viveiro;
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

export type FeedingStatus = 'complete' | 'partial' | 'pending';
export type VisualMode = 'grid' | 'list';
