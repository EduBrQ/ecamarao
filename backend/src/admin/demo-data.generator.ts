import { ViveiroStatus } from '../viveiros/entities/viveiro.entity';
import { calcularRacaoDiariaAvancada, mortalidadeEsperadaPercentual } from '../common/racao-model';

// Gerador de dados de demonstração para carcinicultura no Nordeste
// brasileiro (RN/CE respondem por ~99% da produção nacional de camarão).
// Simula 10 viveiros operando continuamente por 1 ano, respeitando o
// manejo típico da região:
//  - Ciclo de engorda: 75-95 dias (despesca com o camarão entre 8-10g)
//  - Intervalo entre ciclos (preparo do viveiro/"descanso"): 12-16 dias
//  - Povoamento por viveiro: 80 mil a 150 mil pós-larvas, conforme a área
// Cada viveiro só guarda o ciclo ATUAL (o schema não versiona ciclos
// históricos), então o gerador simula uma rotação contínua de um ano só
// para posicionar o viveiro numa fase realista (recém povoado, em
// engorda, perto da despesca, ou em preparo entre ciclos) — não grava
// ciclos passados, evitando misturar dados de ciclos diferentes nas
// mesmas tabelas de ração/mortalidade/medições.

const NOMES_VIVEIROS = [
  'Guamaré', 'Macau', 'Galinhos', 'Areia Branca', 'Tibau',
  'Alto do Rodrigues', 'Ceará-Mirim', 'Canguaretama', 'Aracati', 'Icapuí',
];

const CAUSAS_MORTALIDADE_LEVE = [
  'Baixo oxigênio', 'Estresse térmico', 'Qualidade da água', 'Causa desconhecida', 'Manejo inadequado',
];
const CAUSAS_MORTALIDADE_GRAVE = ['Doença (WSSV)', 'Doença (Vibrio)', 'Doença (EMS/AHPND)', 'Predadores'];

const RANGES_AGUA = {
  ph: { min: 7.5, max: 8.5 },
  oxigenio: { min: 4, max: 10 },
  temperatura: { min: 26, max: 32 },
  alcalinidade: { min: 80, max: 200 },
  transparencia: { min: 25, max: 45 },
  salinidade: { min: 18, max: 32 },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface CicloSimulado {
  ativo: boolean;
  docHoje: number;
  dataInicioCiclo: string;
}

// Simula uma rotação contínua de ciclos ao longo do último ano para achar
// em que fase o viveiro estaria HOJE: em engorda (ativo, com um DOC) ou em
// preparo entre ciclos (data de início = próximo povoamento, no futuro).
function simularCicloAtual(hoje: Date): CicloSimulado {
  let cursor = -365;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const growoutDays = randInt(75, 95);
    const fallowDays = randInt(12, 16);
    const cycleStart = cursor;
    const growoutEnd = cursor + growoutDays;
    const fallowEnd = growoutEnd + fallowDays;

    if (fallowEnd > 0) {
      if (0 < growoutEnd) {
        return { ativo: true, docHoje: -cycleStart, dataInicioCiclo: toISODate(addDays(hoje, cycleStart)) };
      }
      return { ativo: false, docHoje: 0, dataInicioCiclo: toISODate(addDays(hoje, fallowEnd)) };
    }
    cursor = fallowEnd;
  }
}

export interface DemoViveiro {
  nome: string;
  densidade: number;
  area: number;
  data_inicio_ciclo: string;
  status: ViveiroStatus;
}

export interface DemoRacao {
  data: string;
  qntManha: number;
  qntTarde: number;
}

export interface DemoMortalidade {
  data: string;
  quantidade: number;
  causa: string;
}

export interface DemoMedicao {
  data: string;
  oxigenio: number;
  ph: number;
  temperatura: number;
  alcalinidade: number;
  transparencia: number;
  salinidade: number;
}

export interface DemoAerador {
  nome: string;
  status: boolean;
}

export interface DemoViveiroDataset {
  viveiro: DemoViveiro;
  racoes: DemoRacao[];
  mortalidades: DemoMortalidade[];
  medicoes: DemoMedicao[];
  aeradores: DemoAerador[];
}

function gerarViveiro(nome: string, hoje: Date): { viveiro: DemoViveiro; ciclo: CicloSimulado } {
  // Área típica de viveiros comerciais de pequeno/médio porte no
  // Nordeste; densidade ajustada para que a população fique entre 80 mil
  // e 150 mil pós-larvas, dependendo do tamanho do viveiro.
  const area = Math.round(randFloat(1500, 3500));
  const populacaoAlvo = randInt(80000, 150000);
  const densidade = Math.min(90, Math.max(25, Math.round((populacaoAlvo / area) * 10) / 10));

  const ciclo = simularCicloAtual(hoje);

  return {
    viveiro: {
      nome: `Viveiro ${nome}`,
      densidade,
      area,
      data_inicio_ciclo: ciclo.dataInicioCiclo,
      status: ciclo.ativo ? ViveiroStatus.ATIVO : ViveiroStatus.MANUTENCAO,
    },
    ciclo,
  };
}

function gerarMortalidades(populacaoInicial: number, docHoje: number, hoje: Date): DemoMortalidade[] {
  if (docHoje < 1) return [];

  // Meta de mortalidade acumulada do ciclo: em torno da curva esperada do
  // próprio app, com variação de viveiro para viveiro (alguns ciclos vão
  // melhor que a média, outros pior — pressão de doença é real na região).
  const percentualAlvo = mortalidadeEsperadaPercentual(docHoje) * randFloat(0.75, 1.4);
  const totalMortalidade = Math.round((populacaoInicial * percentualAlvo) / 100);
  if (totalMortalidade < 1) return [];

  const cicloRuim = percentualAlvo > 24;
  const numEventos = Math.min(20, Math.max(2, Math.round(docHoje / 8)));

  const dias: number[] = [];
  for (let i = 0; i < numEventos; i++) {
    // Mais eventos concentrados no primeiro terço do ciclo (fase de
    // aclimatação, maior risco), com alguns espalhados no restante.
    const dia = Math.random() < 0.6
      ? randInt(1, Math.max(1, Math.round(docHoje / 3)))
      : randInt(1, docHoje);
    dias.push(dia);
  }
  dias.sort((a, b) => a - b);

  // Distribui o total entre os eventos com pesos aleatórios.
  const pesos = dias.map(() => Math.random() + 0.2);
  const somaPesos = pesos.reduce((a, b) => a + b, 0);

  let restante = totalMortalidade;
  const mortalidades: DemoMortalidade[] = [];
  dias.forEach((dia, i) => {
    const isUltimo = i === dias.length - 1;
    const quantidade = isUltimo
      ? restante
      : Math.max(1, Math.round((pesos[i] / somaPesos) * totalMortalidade));
    restante -= quantidade;
    if (quantidade < 1) return;

    const causa = cicloRuim && Math.random() < 0.4 ? pick(CAUSAS_MORTALIDADE_GRAVE) : pick(CAUSAS_MORTALIDADE_LEVE);
    mortalidades.push({ data: toISODate(addDays(hoje, dia - docHoje)), quantidade, causa });
  });

  return mortalidades;
}

function gerarRacoes(
  densidade: number,
  area: number,
  docHoje: number,
  mortalidades: DemoMortalidade[],
  hoje: Date,
): DemoRacao[] {
  if (docHoje < 1) return [];

  const racoes: DemoRacao[] = [];
  let mortalidadeAcumulada = 0;
  const mortalidadesPorDia = new Map<number, number>();
  mortalidades.forEach((m) => {
    const dia = docHoje + (new Date(m.data + 'T00:00:00').getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    const diaArred = Math.round(dia);
    mortalidadesPorDia.set(diaArred, (mortalidadesPorDia.get(diaArred) ?? 0) + m.quantidade);
  });

  for (let dia = 1; dia <= docHoje; dia++) {
    mortalidadeAcumulada += mortalidadesPorDia.get(dia) ?? 0;

    // ~6% dos dias sem registro (produtor nem sempre lança todo dia).
    if (Math.random() < 0.06) continue;

    const recomendado = calcularRacaoDiariaAvancada(densidade, area, dia, mortalidadeAcumulada);
    if (recomendado.totalKg <= 0) continue;

    // Variação realista em torno da recomendação (produtor ajusta pelo
    // consumo observado na bandeja, não segue a tabela à risca).
    const totalReal = recomendado.totalKg * randFloat(0.85, 1.15);
    const fracaoManha = randFloat(0.35, 0.45);
    const qntManha = Math.round(totalReal * fracaoManha * 100) / 100;
    const qntTarde = Math.round(totalReal * (1 - fracaoManha) * 100) / 100;

    racoes.push({ data: toISODate(addDays(hoje, dia - docHoje)), qntManha, qntTarde });
  }

  return racoes;
}

function gerarMedicoes(docHoje: number, hoje: Date): DemoMedicao[] {
  if (docHoje < 1) return [];

  const medicoes: DemoMedicao[] = [];
  const atual: Record<keyof typeof RANGES_AGUA, number> = {
    ph: randFloat(RANGES_AGUA.ph.min, RANGES_AGUA.ph.max),
    oxigenio: randFloat(RANGES_AGUA.oxigenio.min + 1, RANGES_AGUA.oxigenio.max - 1),
    temperatura: randFloat(RANGES_AGUA.temperatura.min + 1, RANGES_AGUA.temperatura.max - 1),
    alcalinidade: randFloat(RANGES_AGUA.alcalinidade.min + 20, RANGES_AGUA.alcalinidade.max - 20),
    transparencia: randFloat(RANGES_AGUA.transparencia.min + 3, RANGES_AGUA.transparencia.max - 3),
    salinidade: randFloat(RANGES_AGUA.salinidade.min + 2, RANGES_AGUA.salinidade.max - 2),
  };

  let dia = 1;
  while (dia <= docHoje) {
    for (const key of Object.keys(RANGES_AGUA) as (keyof typeof RANGES_AGUA)[]) {
      const range = RANGES_AGUA[key];
      const margin = (range.max - range.min) * 0.2;
      const passo = (range.max - range.min) * 0.08;
      atual[key] = Math.min(range.max + margin, Math.max(range.min - margin, atual[key] + randFloat(-passo, passo)));
    }

    medicoes.push({
      data: toISODate(addDays(hoje, dia - docHoje)),
      ph: Math.round(atual.ph * 100) / 100,
      oxigenio: Math.round(atual.oxigenio * 100) / 100,
      temperatura: Math.round(atual.temperatura * 100) / 100,
      alcalinidade: Math.round(atual.alcalinidade * 100) / 100,
      transparencia: Math.round(atual.transparencia * 100) / 100,
      salinidade: Math.round(atual.salinidade * 100) / 100,
    });

    dia += randInt(2, 4);
  }

  return medicoes;
}

function gerarAeradores(area: number): DemoAerador[] {
  const quantidade = Math.min(8, Math.max(2, Math.round(area / 700)));
  return Array.from({ length: quantidade }, (_, i) => ({
    nome: `Aerador ${i + 1}`,
    status: Math.random() < 0.85,
  }));
}

export function gerarDatasetDemo(): DemoViveiroDataset[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return NOMES_VIVEIROS.map((nome) => {
    const { viveiro, ciclo } = gerarViveiro(nome, hoje);
    const populacaoInicial = viveiro.densidade * viveiro.area;

    const mortalidades = gerarMortalidades(populacaoInicial, ciclo.docHoje, hoje);
    const racoes = gerarRacoes(viveiro.densidade, viveiro.area, ciclo.docHoje, mortalidades, hoje);
    const medicoes = gerarMedicoes(ciclo.docHoje, hoje);
    const aeradores = gerarAeradores(viveiro.area);

    return { viveiro, racoes, mortalidades, medicoes, aeradores };
  });
}
