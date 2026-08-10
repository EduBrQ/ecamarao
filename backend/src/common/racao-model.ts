// Modelo de crescimento, mortalidade e taxa de arraçoamento do camarão
// (Litopenaeus vannamei), calibrado para a prática do Nordeste brasileiro:
// ciclo de cultivo de ~70-100 dias, despesca entre 8-10g (RN/CE respondem
// por ~99% da produção nacional). Módulo puro, sem dependência do NestJS,
// para ser usado tanto pelo dashboard (recomendação em tempo real) quanto
// pelo gerador de dados de demonstração — uma única fonte de verdade no
// backend, espelhando frontend/src/models/types.ts.
//
// Fontes: FAO Technical Paper 583 (Hung & Quy, 2013), Aqua Culture Asia
// Pacific (Akiyama & Yukasano, 2024), Skretting Feed Management Guide
// (2022), Ciencia Animal Brasileira (SciELO, 2018), HOLOS/IFRN -
// Carcinicultura no Vale do Açu-RN (despesca com 10-12g em 70-80 dias).

export interface FaixaRacao {
  docMin: number;
  docMax: number;
  taxaAlimentacao: number; // % da biomassa/dia
  fase: string;
  tipoRacao: string;
  proteina: number; // % de proteina
}

export const TABELA_RACAO: FaixaRacao[] = [
  { docMin: 1, docMax: 15, taxaAlimentacao: 15, fase: 'Bercario', tipoRacao: 'Farelado/Triturado', proteina: 40 },
  { docMin: 16, docMax: 30, taxaAlimentacao: 8, fase: 'Fase Inicial', tipoRacao: 'Pellet 1.0mm', proteina: 38 },
  { docMin: 31, docMax: 45, taxaAlimentacao: 6, fase: 'Crescimento I', tipoRacao: 'Pellet 1.5mm', proteina: 36 },
  { docMin: 46, docMax: 60, taxaAlimentacao: 5, fase: 'Crescimento II', tipoRacao: 'Pellet 2.0mm', proteina: 35 },
  { docMin: 61, docMax: 75, taxaAlimentacao: 4, fase: 'Engorda I', tipoRacao: 'Pellet 2.5mm', proteina: 35 },
  { docMin: 76, docMax: 90, taxaAlimentacao: 3, fase: 'Engorda II', tipoRacao: 'Pellet 2.5mm', proteina: 34 },
  { docMin: 91, docMax: 105, taxaAlimentacao: 2.5, fase: 'Pre-Despesca', tipoRacao: 'Pellet 3.0mm', proteina: 32 },
  { docMin: 106, docMax: 150, taxaAlimentacao: 2, fase: 'Despesca', tipoRacao: 'Pellet 3.0mm', proteina: 32 },
];

// Taxa de crescimento por fase (g/dia), com desaceleração conforme o
// camarão se aproxima de ~30g. Curva atinge ~8.5g no DOC 85 e ~9.6g no
// DOC 95, condizente com a despesca do Nordeste (8-10g em ~70-100 dias).
const TAXA_CRESCIMENTO_POR_FASE: { docMax: number; gPorDia: number }[] = [
  { docMax: 15, gPorDia: 0.03 },
  { docMax: 30, gPorDia: 0.08 },
  { docMax: 50, gPorDia: 0.13 },
  { docMax: 70, gPorDia: 0.17 },
  { docMax: 95, gPorDia: 0.15 },
  { docMax: Infinity, gPorDia: 0.1 },
];

// Curva de mortalidade acumulada esperada por fase (%), usada como piso
// conservador quando a mortalidade registrada for menor que a esperada. Um
// ciclo saudável no Nordeste fecha com 70-85% de sobrevivência; ~20% de
// mortalidade acumulada na despesca reflete um viveiro bem manejado.
const MORTALIDADE_ESPERADA_POR_FASE: { docMax: number; percentual: number }[] = [
  { docMax: 15, percentual: 4 },
  { docMax: 30, percentual: 7 },
  { docMax: 50, percentual: 11 },
  { docMax: 70, percentual: 15 },
  { docMax: 95, percentual: 19 },
  { docMax: Infinity, percentual: 22 },
];

const PESO_INICIAL_PADRAO_G = 0.1; // peso assumido quando o PL inicial nao e informado

export interface RacaoRecomendada {
  fase: string;
  tipoRacao: string;
  proteina: number;
  taxaAlimentacao: number;
  pesoEstimadoG: number;
  populacaoEstimada: number;
  biomassaEstimadaKg: number;
  totalKg: number;
  manhaKg: number;
  tardeKg: number;
}

// Dias de cultivo desde o início do ciclo.
export function calcularDOC(dataInicioCiclo: string): number {
  const inicio = new Date(dataInicioCiclo);
  const hoje = new Date();
  const diffMs = hoje.getTime() - inicio.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function calcularFCR(racaoTotalKg: number, biomassaKg: number): number {
  if (biomassaKg <= 0) return 0;
  return racaoTotalKg / biomassaKg;
}

// População inicial = densidade de estocagem (camarões/m²) x área do
// viveiro (m²). Densidade sozinha não é uma contagem de indivíduos.
export function calcularPopulacaoInicial(densidade: number, area: number): number {
  return Math.max(0, densidade * area);
}

export function getFaixaRacao(doc: number): FaixaRacao | null {
  if (!doc || doc <= 0 || doc > 365) return null;
  return TABELA_RACAO.find((f) => doc >= f.docMin && doc <= f.docMax) ?? null;
}

// Peso estimado (g) a partir de uma curva de crescimento por fase, com
// desaceleração conforme o camarão se aproxima do peso de despesca.
export function preverPesoAtual(doc: number, pesoInicialG = PESO_INICIAL_PADRAO_G): number {
  if (doc <= 0) return pesoInicialG;

  let peso = pesoInicialG;
  for (let dia = 1; dia <= doc; dia++) {
    const taxa = TAXA_CRESCIMENTO_POR_FASE.find((f) => dia <= f.docMax)!.gPorDia;
    const fatorReducao = Math.max(0.4, 1 - peso / 30);
    peso += taxa * fatorReducao;
  }
  return Math.round(peso * 100) / 100;
}

// Percentual de mortalidade acumulada esperado para o DOC informado.
export function mortalidadeEsperadaPercentual(doc: number): number {
  return MORTALIDADE_ESPERADA_POR_FASE.find((f) => doc <= f.docMax)!.percentual;
}

// População atual considerando a curva de mortalidade esperada como piso
// conservador (evita superestimar a biomassa quando a mortalidade
// registrada está incompleta).
export function estimarPopulacaoAtual(densidade: number, area: number, doc: number, mortalidadeTotal: number): number {
  const populacaoInicial = calcularPopulacaoInicial(densidade, area);
  const mortalidadeEsperada = (populacaoInicial * mortalidadeEsperadaPercentual(doc)) / 100;
  const mortalidadeConsiderada = Math.max(mortalidadeTotal, mortalidadeEsperada);
  return Math.max(0, populacaoInicial - mortalidadeConsiderada);
}

export function calcularRacaoDiariaAvancada(
  densidade: number,
  area: number,
  doc: number,
  mortalidadeTotal: number,
): RacaoRecomendada {
  const vazio: RacaoRecomendada = {
    fase: '',
    tipoRacao: '',
    proteina: 0,
    taxaAlimentacao: 0,
    pesoEstimadoG: 0,
    populacaoEstimada: 0,
    biomassaEstimadaKg: 0,
    totalKg: 0,
    manhaKg: 0,
    tardeKg: 0,
  };

  if (!densidade || densidade <= 0 || !area || area <= 0) return vazio;

  const faixa = getFaixaRacao(doc);
  if (!faixa) return vazio;

  const pesoEstimadoG = preverPesoAtual(doc);
  const populacaoEstimada = estimarPopulacaoAtual(densidade, area, doc, mortalidadeTotal);
  const biomassaEstimadaKg = (populacaoEstimada * pesoEstimadoG) / 1000;
  const totalKg = (biomassaEstimadaKg * faixa.taxaAlimentacao) / 100;

  return {
    fase: faixa.fase,
    tipoRacao: faixa.tipoRacao,
    proteina: faixa.proteina,
    taxaAlimentacao: faixa.taxaAlimentacao,
    pesoEstimadoG,
    populacaoEstimada,
    biomassaEstimadaKg,
    totalKg,
    // Manhã 40% / Tarde 60% — camarões se alimentam mais no fim da tarde.
    manhaKg: totalKg * 0.4,
    tardeKg: totalKg * 0.6,
  };
}
