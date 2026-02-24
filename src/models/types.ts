export interface ViveiroDTO {
  id: number;
  densidade?: number;
  laboratorio?: string;
  proprietario?: string;
  dataInicioCiclo?: string;
  pesoMedioAtual?: number;
  precoRacaoKg?: number;
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
  const inicio = new Date(dataInicio + 'T00:00:00');
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
