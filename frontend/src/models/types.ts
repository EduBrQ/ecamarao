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

// Helper: estimate total stocked population (camarões) from stocking
// density (camarões/m²) and pond surface area (m²). Density alone is not a
// headcount — it must be multiplied by the pond's actual area.
export function calcularPopulacaoInicial(densidadePorM2: number, areaM2: number): number {
  return Math.max(0, densidadePorM2 * areaM2);
}

// Helper: estimate biomass (kg)
export function calcularBiomassa(
  densidadePorM2: number,
  areaM2: number,
  mortalidadeTotal: number,
  pesoMedioG: number
): number {
  const vivos = calcularPopulacaoInicial(densidadePorM2, areaM2) - mortalidadeTotal;
  return Math.max(0, (vivos * pesoMedioG) / 1000);
}

// Helper: calculate survival rate (%)
export function calcularSobrevivencia(
  densidadePorM2: number,
  areaM2: number,
  mortalidadeTotal: number
): number {
  const total = calcularPopulacaoInicial(densidadePorM2, areaM2);
  if (total === 0) return 0;
  return Math.max(0, ((total - mortalidadeTotal) / total) * 100);
}

// Helper: calculate FCR (Feed Conversion Ratio)
export function calcularFCR(racaoTotalKg: number, biomassakg: number): number {
  if (biomassakg <= 0) return 0;
  return racaoTotalKg / biomassakg;
}

// Feed rate table based on academic research, with DOC/weight bands
// recalibrated for Nordeste Brazil semi-intensive vannamei practice: ciclo
// de ~70-100 dias com despesca entre 8-12g (RN/CE respondem por ~99% da
// producao nacional). A taxa de alimentacao por faixa de peso segue a
// literatura internacional (FAO 583, Skretting); as faixas de DOC/peso
// foram recalibradas para essa janela de ciclo curto, tipica do Nordeste,
// em vez de ciclos longos (120-130 dias) voltados a camarao maior.
// Sources: FAO Technical Paper 583 (Hung & Quy, 2013), Aqua Culture Asia Pacific (Akiyama & Yukasano, 2024),
// Skretting Feed Management Guide (2022), SciELO Brasil (Ciencia Animal Brasileira, 2018),
// HOLOS/IFRN - Carcinicultura no Vale do Acu-RN (despesca com 10-12g em 70-80 dias)
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
  { docMin: 1, docMax: 15, pesoMedioMin: 0, pesoMedioMax: 0.6, taxaAlimentacao: 15, frequencia: 4, tipoRacao: 'Farelado/Triturado', proteina: 40, fase: 'Bercario' },
  { docMin: 16, docMax: 30, pesoMedioMin: 0.6, pesoMedioMax: 1.7, taxaAlimentacao: 8, frequencia: 3, tipoRacao: 'Pellet 1.0mm', proteina: 38, fase: 'Fase Inicial' },
  { docMin: 31, docMax: 45, pesoMedioMin: 1.7, pesoMedioMax: 3.5, taxaAlimentacao: 6, frequencia: 2, tipoRacao: 'Pellet 1.5mm', proteina: 36, fase: 'Crescimento I' },
  { docMin: 46, docMax: 60, pesoMedioMin: 3.5, pesoMedioMax: 5.5, taxaAlimentacao: 5, frequencia: 2, tipoRacao: 'Pellet 2.0mm', proteina: 35, fase: 'Crescimento II' },
  { docMin: 61, docMax: 75, pesoMedioMin: 5.5, pesoMedioMax: 7.4, taxaAlimentacao: 4, frequencia: 2, tipoRacao: 'Pellet 2.5mm', proteina: 35, fase: 'Engorda I' },
  { docMin: 76, docMax: 90, pesoMedioMin: 7.4, pesoMedioMax: 9.1, taxaAlimentacao: 3, frequencia: 2, tipoRacao: 'Pellet 2.5mm', proteina: 34, fase: 'Engorda II' },
  { docMin: 91, docMax: 105, pesoMedioMin: 9.1, pesoMedioMax: 9.9, taxaAlimentacao: 2.5, frequencia: 2, tipoRacao: 'Pellet 3.0mm', proteina: 32, fase: 'Pre-Despesca' },
  { docMin: 106, docMax: 150, pesoMedioMin: 9.9, pesoMedioMax: 13, taxaAlimentacao: 2, frequencia: 2, tipoRacao: 'Pellet 3.0mm', proteina: 32, fase: 'Despesca' },
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
    // Growth rate factors by phase (g/day), adjusted for PL starting point.
    // Calibrated to Nordeste Brazil practice: despesca com 8-10g em torno
    // de 80-95 dias de cultivo (ver preverPesoAtual abaixo para fontes).
    const fatoresCrescimento = {
      berçario: 0.03,       // DOC 1-15
      inicial: 0.08,        // DOC 16-30
      crescimento1: 0.13,   // DOC 31-50
      crescimento2: 0.17,   // DOC 51-70
      preDespesca: 0.15,    // DOC 71-95
      despesca: 0.10,       // DOC 96+
    };

    let docAtual = plData.dias + 1; // Start counting from day after PL

    while (docAtual <= doc) {
      let taxaCrescimento: number;

      if (docAtual <= 15) taxaCrescimento = fatoresCrescimento.berçario;
      else if (docAtual <= 30) taxaCrescimento = fatoresCrescimento.inicial;
      else if (docAtual <= 50) taxaCrescimento = fatoresCrescimento.crescimento1;
      else if (docAtual <= 70) taxaCrescimento = fatoresCrescimento.crescimento2;
      else if (docAtual <= 95) taxaCrescimento = fatoresCrescimento.preDespesca;
      else taxaCrescimento = fatoresCrescimento.despesca;

      // Apply growth with diminishing returns as weight increases
      const fatorReducao = Math.max(0.4, 1 - (peso / 30)); // Growth slows as shrimp approaches 30g
      peso += (taxaCrescimento * fatorReducao);
      docAtual++;
    }
  }

  return Math.round(peso * 10000) / 10000; // 4 decimal places for precision
}

// Helper: estimate current shrimp weight based on DOC and growth curve.
// Calibrated to Nordeste Brazil semi-intensive vannamei practice (RN/CE
// respondem por ~99% da producao nacional): ciclo de cultivo de ~70-100
// dias, despesca tipicamente entre 8-10g (curva atinge ~8.5g no DOC 85 e
// ~9.6g no DOC 95).
// Sources: HOLOS/IFRN - Carcinicultura no Vale do Acu-RN (despesca com
// 10-12g em 70-80 dias); FAO Technical Paper 583 (Hung & Quy, 2013);
// Aqua Culture Asia Pacific (Akiyama & Yukasano, 2024).
export function preverPesoAtual(doc: number, pesoInicialG: number = 0.1): number {
  if (doc <= 0) return pesoInicialG;

  // Growth rate factors by phase (g/day)
  const fatoresCrescimento = {
    berçario: 0.03,       // DOC 1-15: aclimatacao, crescimento lento
    inicial: 0.08,        // DOC 16-30: crescimento moderado
    crescimento1: 0.13,   // DOC 31-50: crescimento acelerado
    crescimento2: 0.17,   // DOC 51-70: pico de crescimento
    preDespesca: 0.15,    // DOC 71-95: janela tipica de despesca (8-10g)
    despesca: 0.10,       // DOC 96+: ciclo estendido, crescimento reduzido
  };

  let peso = pesoInicialG;
  let docAtual = 1;

  while (docAtual <= doc) {
    let taxaCrescimento: number;

    if (docAtual <= 15) taxaCrescimento = fatoresCrescimento.berçario;
    else if (docAtual <= 30) taxaCrescimento = fatoresCrescimento.inicial;
    else if (docAtual <= 50) taxaCrescimento = fatoresCrescimento.crescimento1;
    else if (docAtual <= 70) taxaCrescimento = fatoresCrescimento.crescimento2;
    else if (docAtual <= 95) taxaCrescimento = fatoresCrescimento.preDespesca;
    else taxaCrescimento = fatoresCrescimento.despesca;

    // Apply growth with diminishing returns as weight increases
    const fatorReducao = Math.max(0.4, 1 - (peso / 30)); // Growth slows as shrimp approaches 30g
    peso += (taxaCrescimento * fatorReducao);
    docAtual++;
  }

  return Math.round(peso * 100) / 100;
}

// Helper: estimate current shrimp population considering mortality curve
export function estimarPopulacaoAtual(
  densidadePorM2: number,
  areaM2: number,
  doc: number,
  registrosMortalidade: RegistroMortalidade[]
): number {
  const populacaoInicial = calcularPopulacaoInicial(densidadePorM2, areaM2);
  
  // Base mortality curve by phase (cumulative %), recalibrated to the
  // shorter ~70-100 day Nordeste cycle. A healthy commercial cycle in RN/CE
  // typically closes with 70-85% survival; ~20% cumulative mortality by
  // despesca reflects a well-managed pond (disease outbreaks like
  // WSSV/AHPND can push this much higher, which recorded mortality would
  // then override via the max() below).
  const mortalidadeBase = {
    berçario: 4,         // DOC 1-15
    inicial: 7,          // DOC 16-30
    crescimento1: 11,    // DOC 31-50
    crescimento2: 15,    // DOC 51-70
    preDespesca: 19,     // DOC 71-95
    despesca: 22,        // DOC 96+
  };

  let mortalidadeEsperadaPercentual = mortalidadeBase.berçario;
  if (doc <= 15) mortalidadeEsperadaPercentual = mortalidadeBase.berçario;
  else if (doc <= 30) mortalidadeEsperadaPercentual = mortalidadeBase.inicial;
  else if (doc <= 50) mortalidadeEsperadaPercentual = mortalidadeBase.crescimento1;
  else if (doc <= 70) mortalidadeEsperadaPercentual = mortalidadeBase.crescimento2;
  else if (doc <= 95) mortalidadeEsperadaPercentual = mortalidadeBase.preDespesca;
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
  densidadePorM2: number,
  areaM2: number,
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
  // Validate inputs
  if (!densidadePorM2 || densidadePorM2 <= 0 || !areaM2 || areaM2 <= 0) {
    console.warn('calcularRacaoDiariaAvancada - Densidade ou área inválida:', densidadePorM2, areaM2);
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

  if (!faixa) {
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
  
  // Estimate current population
  const populacaoEstimada = estimarPopulacaoAtual(densidadePorM2, areaM2, doc, registrosMortalidade);

  // Validate population
  if (populacaoEstimada <= 0) {
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
