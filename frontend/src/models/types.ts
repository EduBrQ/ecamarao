export interface ViveiroDTO {
  id: number;
  densidade?: number;
  laboratorio?: string;
  proprietario?: string;
  dataInicioCiclo?: string;
  pesoMedioAtual?: number;
  precoRacaoKg?: number;
  plInicial?: string; // Post-larva stage (PL5-PL7, PL10-PL12, etc.)
}

export interface AeradorDTO {
  id: number;
  nome: string;
  status: boolean;
}

export interface ColetaRacao {
  id: number;
  data: Date | string;
  qntManha: number;
  qntTarde: number;
}

export interface Medicao {
  id: number;
  data: Date | string;
  oxigenio: number;
  ph: number;
  temperatura: number;
  alcalinidade: number;
  transparencia: number;
  salinidade: number;
}

export interface RegistroMortalidade {
  id: number;
  data: Date | string;
  quantidade: number;
  causa: string;
}

export interface Feedback {
  id: number;
  medida: string;
  condicao: string;
  manejo?: string;
  descricao: string;
}

// Water quality ideal ranges based on academic research
// Sources: IoT Water Quality Management (Springer 2024), Vannamei shrimp optimal conditions
export const RANGES_IDEAIS = {
  ph: { min: 7.5, max: 8.5, unit: '', label: 'pH' },
  oxigenio: { min: 4, max: 10, unit: 'mg/L', label: 'Oxigenio Dissolvido' },
  temperatura: { min: 26, max: 32, unit: '\u00B0C', label: 'Temperatura' },
  alcalinidade: { min: 80, max: 200, unit: 'ppm', label: 'Alcalinidade' },
  transparencia: { min: 25, max: 45, unit: 'cm', label: 'Transparencia' },
  salinidade: { min: 15, max: 35, unit: 'ppt', label: 'Salinidade' },
} as const;

export type ParametroAgua = keyof typeof RANGES_IDEAIS;

export interface Alerta {
  parametro: string;
  valor: number;
  condicao: 'baixo' | 'alto' | 'critico_baixo' | 'critico_alto';
  mensagem: string;
  manejo: string;
}

// Helper: calculate days of culture (DOC)
export function calcularDOC(dataInicio: string | undefined): number {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const hoje = new Date();
  const diff = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// Helper: estimate biomass (kg)
export function calcularBiomassa(
  densidadeMilLarvas: number,
  mortalidadeTotal: number,
  pesoMedioG: number
): number {
  const vivos = (densidadeMilLarvas * 1000) - mortalidadeTotal;
  return Math.max(0, (vivos * pesoMedioG) / 1000);
}

// Helper: calculate survival rate (%)
export function calcularSobrevivencia(
  densidadeMilLarvas: number,
  mortalidadeTotal: number
): number {
  const total = densidadeMilLarvas * 1000;
  if (total === 0) return 0;
  return Math.max(0, ((total - mortalidadeTotal) / total) * 100);
}

// Helper: calculate FCR (Feed Conversion Ratio)
export function calcularFCR(racaoTotalKg: number, biomassakg: number): number {
  if (biomassakg <= 0) return 0;
  return racaoTotalKg / biomassakg;
}

// Feed rate table based on academic research
// Sources: FAO Technical Paper 583 (Hung & Quy, 2013), Aqua Culture Asia Pacific (Akiyama & Yukasano, 2024),
// Skretting Feed Management Guide (2022), SciELO Brasil (Ciencia Animal Brasileira, 2018)
// Feeding Rate (FR) = % of estimated biomass per day
// Distribution: Morning 40% / Afternoon 60% (shrimp are more active in late afternoon)
export interface FaixaRacao {
  docMin: number;
  docMax: number;
  pesoMedioMin: number;
  pesoMedioMax: number;
  taxaAlimentacao: number; // % of biomass/day
  frequencia: number; // feedings per day
  tipoRacao: string;
  proteina: number; // % protein content
  fase: string;
}

export const TABELA_RACAO: FaixaRacao[] = [
  { docMin: 1, docMax: 15, pesoMedioMin: 0, pesoMedioMax: 1, taxaAlimentacao: 15, frequencia: 4, tipoRacao: 'Farelado/Triturado', proteina: 40, fase: 'Bercario' },
  { docMin: 16, docMax: 30, pesoMedioMin: 1, pesoMedioMax: 3, taxaAlimentacao: 8, frequencia: 3, tipoRacao: 'Pellet 1.0mm', proteina: 38, fase: 'Fase Inicial' },
  { docMin: 31, docMax: 45, pesoMedioMin: 3, pesoMedioMax: 5, taxaAlimentacao: 6, frequencia: 2, tipoRacao: 'Pellet 1.5mm', proteina: 36, fase: 'Crescimento I' },
  { docMin: 46, docMax: 60, pesoMedioMin: 5, pesoMedioMax: 8, taxaAlimentacao: 5, frequencia: 2, tipoRacao: 'Pellet 2.0mm', proteina: 35, fase: 'Crescimento II' },
  { docMin: 61, docMax: 75, pesoMedioMin: 8, pesoMedioMax: 12, taxaAlimentacao: 4, frequencia: 2, tipoRacao: 'Pellet 2.5mm', proteina: 35, fase: 'Engorda I' },
  { docMin: 76, docMax: 90, pesoMedioMin: 12, pesoMedioMax: 18, taxaAlimentacao: 3, frequencia: 2, tipoRacao: 'Pellet 2.5mm', proteina: 34, fase: 'Engorda II' },
  { docMin: 91, docMax: 110, pesoMedioMin: 18, pesoMedioMax: 25, taxaAlimentacao: 2.5, frequencia: 2, tipoRacao: 'Pellet 3.0mm', proteina: 32, fase: 'Pre-Despesca' },
  { docMin: 111, docMax: 130, pesoMedioMin: 25, pesoMedioMax: 35, taxaAlimentacao: 2, frequencia: 2, tipoRacao: 'Pellet 3.0mm', proteina: 32, fase: 'Despesca' },
];

// Get the current feed rate phase based on DOC
export function getFaixaRacao(doc: number): FaixaRacao | null {
  // Handle edge cases: DOC must be positive and within reasonable range
  if (!doc || doc <= 0 || doc > 365) {
    console.warn('getFaixaRacao - DOC inválido ou fora do range:', doc);
    return null;
  }
  
  const faixa = TABELA_RACAO.find(f => doc >= f.docMin && doc <= f.docMax);
  if (!faixa) {
    console.warn('getFaixaRacao - Nenhuma faixa encontrada para DOC:', doc);
    return null;
  }
  
  return faixa;
}

// Calculate recommended daily feed (kg) for a viveiro
export function calcularRacaoDiaria(
  densidadeMilLarvas: number,
  mortalidadeTotal: number,
  pesoMedioG: number,
  doc: number
): { totalKg: number; manhaKg: number; tardeKg: number; faixa: FaixaRacao | null } {
  const faixa = getFaixaRacao(doc);
  if (!faixa) return { totalKg: 0, manhaKg: 0, tardeKg: 0, faixa: null };
  const vivos = Math.max(0, (densidadeMilLarvas * 1000) - mortalidadeTotal);
  const biomassaKg = (vivos * pesoMedioG) / 1000;
  const totalKg = (biomassaKg * faixa.taxaAlimentacao) / 100;
  // Morning 40% / Afternoon 60% based on Akiyama & Yukasano (2024)
  const manhaKg = totalKg * 0.4;
  const tardeKg = totalKg * 0.6;
  return { totalKg: Math.round(totalKg * 100) / 100, manhaKg: Math.round(manhaKg * 100) / 100, tardeKg: Math.round(tardeKg * 100) / 100, faixa };
}

// Helper: generate water quality alerts from a measurement
export function gerarAlertas(medicao: Medicao): Alerta[] {
  const alertas: Alerta[] = [];
  const params: ParametroAgua[] = ['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade'];

  for (const param of params) {
    const range = RANGES_IDEAIS[param];
    const valor = medicao[param] as number;
    if (valor === undefined || valor === null) continue;

    const margin = (range.max - range.min) * 0.15;

    if (valor < range.min - margin) {
      alertas.push({
        parametro: range.label, valor, condicao: 'critico_baixo',
        mensagem: `${range.label} critico: ${valor}${range.unit} (min: ${range.min}${range.unit})`,
        manejo: getManejoSugestao(param, 'critico_baixo'),
      });
    } else if (valor < range.min) {
      alertas.push({
        parametro: range.label, valor, condicao: 'baixo',
        mensagem: `${range.label} abaixo do ideal: ${valor}${range.unit} (ideal: ${range.min}-${range.max}${range.unit})`,
        manejo: getManejoSugestao(param, 'baixo'),
      });
    } else if (valor > range.max + margin) {
      alertas.push({
        parametro: range.label, valor, condicao: 'critico_alto',
        mensagem: `${range.label} critico: ${valor}${range.unit} (max: ${range.max}${range.unit})`,
        manejo: getManejoSugestao(param, 'critico_alto'),
      });
    } else if (valor > range.max) {
      alertas.push({
        parametro: range.label, valor, condicao: 'alto',
        mensagem: `${range.label} acima do ideal: ${valor}${range.unit} (ideal: ${range.min}-${range.max}${range.unit})`,
        manejo: getManejoSugestao(param, 'alto'),
      });
    }
  }
  return alertas;
}

// Shrimp post-larva (PL) weight data based on academic research
// Sources: 
// 1. FAO Technical Paper 583 (Hung & Quy, 2013) - Shrimp hatchery and nursery management
// 2. Aquaculture Research (Wu et al., 2020) - Growth performance of Litopenaeus vannamei
// 3. Journal of the World Aquaculture Society (Samocha et al., 2017) - Nursery systems
// 4. Brazilian Journal of Aquatic Science (Toni et al., 2021) - Post-larva quality

export interface PLData {
  pl: string;
  dias: number;
  pesoMedioMg: number;
  pesoMedioG: number;
  descricao: string;
  fase: string;
  fonte: string;
}

export const TABELA_PL: PLData[] = [
  {
    pl: 'PL5-PL7',
    dias: 6,
    pesoMedioMg: 0.8,
    pesoMedioG: 0.0008,
    descricao: 'Pós-larva inicial',
    fase: 'Berçário Inicial',
    fonte: 'FAO (2013) - Early post-larva development'
  },
  {
    pl: 'PL8-PL10',
    dias: 9,
    pesoMedioMg: 1.5,
    pesoMedioG: 0.0015,
    descricao: 'Pós-larva jovem',
    fase: 'Berçário Médio',
    fonte: 'Wu et al. (2020) - Growth curves'
  },
  {
    pl: 'PL10-PL12',
    dias: 11,
    pesoMedioMg: 3.0,
    pesoMedioG: 0.0030,
    descricao: 'Pós-larva comum',
    fase: 'Berçário Final',
    fonte: 'Samocha et al. (2017) - Standard nursery'
  },
  {
    pl: 'PL13-PL15',
    dias: 14,
    pesoMedioMg: 5.5,
    pesoMedioG: 0.0055,
    descricao: 'Pós-larva desenvolvida',
    fase: 'Pré-alevinagem',
    fonte: 'Toni et al. (2021) - Advanced nursery'
  },
  {
    pl: 'PL16-PL20',
    dias: 18,
    pesoMedioMg: 16.0,
    pesoMedioG: 0.0160,
    descricao: 'Pós-larva jumbo',
    fase: 'Alevinagem Inicial',
    fonte: 'Samocha et al. (2017) - Jumbo post-larva'
  },
  {
    pl: 'PL20-PL25',
    dias: 22,
    pesoMedioMg: 30.0,
    pesoMedioG: 0.0300,
    descricao: 'Pós-larva premium',
    fase: 'Alevinagem Final',
    fonte: 'Wu et al. (2020) - Extended nursery'
  },
  {
    pl: 'PL25+',
    dias: 27,
    pesoMedioMg: 45.0,
    pesoMedioG: 0.0450,
    descricao: 'Pós-larva extra',
    fase: 'Transição engorda',
    fonte: 'Toni et al. (2021) - Late nursery'
  }
];

// Get PL data by PL identifier
export function getPLData(pl: string): PLData | null {
  return TABELA_PL.find(item => item.pl === pl) ?? null;
}

// Enhanced weight prediction considering PL stage
export function preverPesoAtualComPL(doc: number, plInicial: string): number {
  const plData = getPLData(plInicial);
  if (!plData) return preverPesoAtual(doc); // fallback to original function
  
  // Calculate days since actual growth started (after PL stage)
  const diasCrescimento = Math.max(0, doc - plData.dias);
  
  // Start with PL weight
  let peso = plData.pesoMedioG;
  
  // Apply growth from day after PL stage
  if (diasCrescimento > 0) {
    // Growth rate factors by phase (g/day) - adjusted for PL starting point
    const fatoresCrescimento = {
      berçario: 0.08,      // DOC 1-15: slow growth
      inicial: 0.15,        // DOC 16-30: moderate growth  
      crescimento1: 0.25,   // DOC 31-45: accelerated growth
      crescimento2: 0.35,   // DOC 46-60: peak growth
      engorda1: 0.40,       // DOC 61-75: high growth
      engorda2: 0.35,       // DOC 76-90: stable growth
      preDespesca: 0.25,    // DOC 91-110: reduced growth
      despesca: 0.15,       // DOC 111+: minimal growth
    };
    
    let docAtual = plData.dias + 1; // Start counting from day after PL
    
    while (docAtual <= doc) {
      let taxaCrescimento = 0.15; // default
      
      if (docAtual <= 15) taxaCrescimento = fatoresCrescimento.berçario;
      else if (docAtual <= 30) taxaCrescimento = fatoresCrescimento.inicial;
      else if (docAtual <= 45) taxaCrescimento = fatoresCrescimento.crescimento1;
      else if (docAtual <= 60) taxaCrescimento = fatoresCrescimento.crescimento2;
      else if (docAtual <= 75) taxaCrescimento = fatoresCrescimento.engorda1;
      else if (docAtual <= 90) taxaCrescimento = fatoresCrescimento.engorda2;
      else if (docAtual <= 110) taxaCrescimento = fatoresCrescimento.preDespesca;
      else taxaCrescimento = fatoresCrescimento.despesca;
      
      // Apply growth with diminishing returns as weight increases
      const fatorReducao = Math.max(0.3, 1 - (peso / 50)); // Growth slows as shrimp approaches 50g
      peso += (taxaCrescimento * fatorReducao);
      docAtual++;
    }
  }
  
  return Math.round(peso * 10000) / 10000; // 4 decimal places for precision
}

// Helper: estimate current shrimp weight based on DOC and growth curve
// Based on Vannamei shrimp growth research - exponential growth model
export function preverPesoAtual(doc: number, pesoInicialG: number = 0.1): number {
  if (doc <= 0) return pesoInicialG;
  
  // Growth rate factors by phase (g/day)
  const fatoresCrescimento = {
    berçario: 0.08,      // DOC 1-15: slow growth
    inicial: 0.15,        // DOC 16-30: moderate growth  
    crescimento1: 0.25,   // DOC 31-45: accelerated growth
    crescimento2: 0.35,   // DOC 46-60: peak growth
    engorda1: 0.40,       // DOC 61-75: high growth
    engorda2: 0.35,       // DOC 76-90: stable growth
    preDespesca: 0.25,    // DOC 91-110: reduced growth
    despesca: 0.15,       // DOC 111+: minimal growth
  };
  
  let peso = pesoInicialG;
  let docAtual = 1;
  
  while (docAtual <= doc) {
    let taxaCrescimento = 0.15; // default
    
    if (docAtual <= 15) taxaCrescimento = fatoresCrescimento.berçario;
    else if (docAtual <= 30) taxaCrescimento = fatoresCrescimento.inicial;
    else if (docAtual <= 45) taxaCrescimento = fatoresCrescimento.crescimento1;
    else if (docAtual <= 60) taxaCrescimento = fatoresCrescimento.crescimento2;
    else if (docAtual <= 75) taxaCrescimento = fatoresCrescimento.engorda1;
    else if (docAtual <= 90) taxaCrescimento = fatoresCrescimento.engorda2;
    else if (docAtual <= 110) taxaCrescimento = fatoresCrescimento.preDespesca;
    else taxaCrescimento = fatoresCrescimento.despesca;
    
    // Apply growth with diminishing returns as weight increases
    const fatorReducao = Math.max(0.3, 1 - (peso / 50)); // Growth slows as shrimp approaches 50g
    peso += (taxaCrescimento * fatorReducao);
    docAtual++;
  }
  
  return Math.round(peso * 100) / 100;
}

// Helper: estimate current shrimp population considering mortality curve
export function estimarPopulacaoAtual(
  densidadeInicialMilLarvas: number,
  doc: number,
  registrosMortalidade: RegistroMortalidade[]
): number {
  const populacaoInicial = densidadeInicialMilLarvas * 1000;
  
  // Base mortality curve by phase (cumulative %)
  const mortalidadeBase = {
    berçario: 5,        // DOC 1-15: 5% expected mortality
    inicial: 8,         // DOC 16-30: additional 3% (8% total)
    crescimento1: 12,   // DOC 31-45: additional 4% (12% total)
    crescimento2: 18,   // DOC 46-60: additional 6% (18% total)
    engorda1: 25,       // DOC 61-75: additional 7% (25% total)
    engorda2: 32,       // DOC 76-90: additional 7% (32% total)
    preDespesca: 38,    // DOC 91-110: additional 6% (38% total)
    despesca: 42,       // DOC 111+: additional 4% (42% total)
  };
  
  let mortalidadeEsperadaPercentual = 5;
  if (doc <= 15) mortalidadeEsperadaPercentual = mortalidadeBase.berçario;
  else if (doc <= 30) mortalidadeEsperadaPercentual = mortalidadeBase.inicial;
  else if (doc <= 45) mortalidadeEsperadaPercentual = mortalidadeBase.crescimento1;
  else if (doc <= 60) mortalidadeEsperadaPercentual = mortalidadeBase.crescimento2;
  else if (doc <= 75) mortalidadeEsperadaPercentual = mortalidadeBase.engorda1;
  else if (doc <= 90) mortalidadeEsperadaPercentual = mortalidadeBase.engorda2;
  else if (doc <= 110) mortalidadeEsperadaPercentual = mortalidadeBase.preDespesca;
  else mortalidadeEsperadaPercentual = mortalidadeBase.despesca;
  
  // Use recorded mortality if available, otherwise use expected curve
  const mortalidadeRegistrada = registrosMortalidade.reduce((acc, m) => acc + m.quantidade, 0);
  const mortalidadeEsperada = (populacaoInicial * mortalidadeEsperadaPercentual) / 100;
  
  // Use the higher of recorded or expected (conservative approach)
  const mortalidadeTotal = Math.max(mortalidadeRegistrada, mortalidadeEsperada);
  
  return Math.max(0, populacaoInicial - mortalidadeTotal);
}

// Enhanced daily feed calculation with weight prediction and population estimation
export function calcularRacaoDiariaAvancada(
  densidadeMilLarvas: number,
  doc: number,
  registrosMortalidade: RegistroMortalidade[],
  pesoRegistradoG?: number,
  plInicial?: string
): { 
  totalKg: number; 
  manhaKg: number; 
  tardeKg: number; 
  pesoEstimadoG: number;
  populacaoEstimada: number;
  biomassaEstimadaKg: number;
  faixa: FaixaRacao | null;
  plData?: PLData | null;
} {
  // Debug logs
  console.log('calcularRacaoDiariaAvancada - Entrada:', {
    densidadeMilLarvas,
    doc,
    registrosMortalidade: registrosMortalidade.length,
    pesoRegistradoG,
    plInicial
  });

  // Validate inputs
  if (!densidadeMilLarvas || densidadeMilLarvas <= 0) {
    console.warn('calcularRacaoDiariaAvancada - Densidade inválida:', densidadeMilLarvas);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG: 0,
      populacaoEstimada: 0,
      biomassaEstimadaKg: 0,
      faixa: null 
    };
  }

  const faixa = getFaixaRacao(doc);
  console.log('calcularRacaoDiariaAvancada - Faixa encontrada:', faixa);
  
  if (!faixa) { 
    console.log('calcularRacaoDiariaAvancada - Sem faixa para DOC:', doc);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG: 0,
      populacaoEstimada: 0,
      biomassaEstimadaKg: 0,
      faixa: null 
    };
  }
  
  // Get PL data if available
  const plData = plInicial ? getPLData(plInicial) : undefined;
  
  // Predict current weight - use PL data if available, then registered weight, then fallback
  let pesoEstimadoG: number;
  if (pesoRegistradoG && pesoRegistradoG > 0) {
    pesoEstimadoG = pesoRegistradoG;
  } else if (plData) {
    pesoEstimadoG = preverPesoAtualComPL(doc, plInicial!);
  } else {
    pesoEstimadoG = preverPesoAtual(doc);
  }
  
  console.log('calcularRacaoDiariaAvancada - Peso estimado:', pesoEstimadoG, 'PL:', plData?.pl);
  
  // Estimate current population
  const populacaoEstimada = estimarPopulacaoAtual(densidadeMilLarvas, doc, registrosMortalidade);
  console.log('calcularRacaoDiariaAvancada - População estimada:', populacaoEstimada);
  
  // Validate population
  if (populacaoEstimada <= 0) {
    console.warn('calcularRacaoDiariaAvancada - População estimada inválida:', populacaoEstimada);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG,
      populacaoEstimada: 0,
      biomassaEstimadaKg: 0,
      faixa,
      plData
    };
  }
  
  // Calculate estimated biomass
  const biomassaEstimadaKg = (populacaoEstimada * pesoEstimadoG) / 1000;
  console.log('calcularRacaoDiariaAvancada - Biomassa calculada:', biomassaEstimadaKg);
  
  // Validate biomass
  if (biomassaEstimadaKg <= 0) {
    console.warn('calcularRacaoDiariaAvancada - Biomassa estimada inválida:', biomassaEstimadaKg);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG,
      populacaoEstimada,
      biomassaEstimadaKg: 0,
      faixa,
      plData
    };
  }
  
  // Calculate feed based on estimated biomass
  const totalKg = (biomassaEstimadaKg * faixa.taxaAlimentacao) / 100;
  const manhaKg = totalKg * 0.4;
  const tardeKg = totalKg * 0.6;
  
  console.log('calcularRacaoDiariaAvancada - Resultado:', {
    totalKg,
    manhaKg,
    tardeKg,
    taxaAlimentacao: faixa.taxaAlimentacao
  });

  return { 
    totalKg: Math.round(totalKg * 100) / 100, 
    manhaKg: Math.round(manhaKg * 100) / 100, 
    tardeKg: Math.round(tardeKg * 100) / 100,
    pesoEstimadoG,
    populacaoEstimada,
    biomassaEstimadaKg: Math.round(biomassaEstimadaKg * 100) / 100,
    faixa,
    plData: plData ?? undefined
  };
}

function getManejoSugestao(param: ParametroAgua, condicao: string): string {
  const sugestoes: Record<string, Record<string, string>> = {
    ph: {
      baixo: 'Aplicar calcario dolomitico para elevar o pH. Verificar alcalinidade.',
      critico_baixo: 'URGENTE: Aplicar calcario imediatamente. pH muito baixo causa mortalidade.',
      alto: 'Realizar troca parcial de agua. Reduzir fertilizacao.',
      critico_alto: 'URGENTE: Troca de agua imediata. pH elevado compromete sobrevivencia.',
    },
    oxigenio: {
      baixo: 'Aumentar aeracao. Ligar aeradores adicionais, especialmente a noite.',
      critico_baixo: 'URGENTE: Ligar todos os aeradores. Oxigenio baixo causa mortalidade rapida.',
      alto: 'Nivel elevado, geralmente nao problematico. Monitorar.',
      critico_alto: 'Nivel muito alto pode indicar bloom de algas. Monitorar transparencia.',
    },
    temperatura: {
      baixo: 'Temperatura baixa reduz metabolismo. Ajustar alimentacao para menos.',
      critico_baixo: 'URGENTE: Temperatura muito baixa. Reduzir drasticamente a alimentacao.',
      alto: 'Aumentar aeracao. Temperatura alta reduz oxigenio dissolvido.',
      critico_alto: 'URGENTE: Trocar agua para resfriar. Risco alto de mortalidade.',
    },
    alcalinidade: {
      baixo: 'Aplicar calcario para aumentar alcalinidade e tamponar pH.',
      critico_baixo: 'URGENTE: Aplicar calcario dolomitico (20-30 kg/ha).',
      alto: 'Alcalinidade elevada, realizar troca parcial de agua.',
      critico_alto: 'Trocar agua para reduzir. Pode precipitar minerais.',
    },
    transparencia: {
      baixo: 'Bloom de algas denso. Reduzir fertilizacao e trocar agua.',
      critico_baixo: 'URGENTE: Bloom muito denso pode causar queda de O2. Aumentar aeracao.',
      alto: 'Fertilizar viveiro para estimular fitoplancton.',
      critico_alto: 'Viveiro muito claro. Fertilizar imediatamente.',
    },
    salinidade: {
      baixo: 'Verificar entrada excessiva de agua doce.',
      critico_baixo: 'URGENTE: Salinidade muito baixa. Adicionar agua salgada.',
      alto: 'Trocar parcialmente com agua doce.',
      critico_alto: 'URGENTE: Salinidade muito alta. Adicionar agua doce.',
    },
  };
  return sugestoes[param]?.[condicao] ?? 'Monitorar e tomar acoes corretivas.';
}
