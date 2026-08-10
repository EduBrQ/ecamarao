import { Injectable } from '@nestjs/common';
import { ViveirosService } from '../viveiros/viveiros.service';
import { RacaoService } from '../racao/racao.service';
import { MortalidadeService } from '../mortalidade/mortalidade.service';

interface FaixaRacao {
  docMin: number;
  docMax: number;
  taxaAlimentacao: number; // % da biomassa/dia
  fase: string;
  tipoRacao: string;
  proteina: number; // % de proteina
}

// Tabela de taxa de arracoamento por fase do ciclo (DOC = dias de cultivo).
// Fontes: FAO Technical Paper 583 (Hung & Quy, 2013), Aqua Culture Asia
// Pacific (Akiyama & Yukasano, 2024), Skretting Feed Management Guide
// (2022), Ciencia Animal Brasileira (SciELO, 2018).
// Mantida identica a frontend/src/models/types.ts (TABELA_RACAO) para que
// o dashboard da fazenda e a tela por viveiro nunca divirjam.
const TABELA_RACAO: FaixaRacao[] = [
  { docMin: 1, docMax: 15, taxaAlimentacao: 15, fase: 'Bercario', tipoRacao: 'Farelado/Triturado', proteina: 40 },
  { docMin: 16, docMax: 30, taxaAlimentacao: 8, fase: 'Fase Inicial', tipoRacao: 'Pellet 1.0mm', proteina: 38 },
  { docMin: 31, docMax: 45, taxaAlimentacao: 6, fase: 'Crescimento I', tipoRacao: 'Pellet 1.5mm', proteina: 36 },
  { docMin: 46, docMax: 60, taxaAlimentacao: 5, fase: 'Crescimento II', tipoRacao: 'Pellet 2.0mm', proteina: 35 },
  { docMin: 61, docMax: 75, taxaAlimentacao: 4, fase: 'Engorda I', tipoRacao: 'Pellet 2.5mm', proteina: 35 },
  { docMin: 76, docMax: 90, taxaAlimentacao: 3, fase: 'Engorda II', tipoRacao: 'Pellet 2.5mm', proteina: 34 },
  { docMin: 91, docMax: 110, taxaAlimentacao: 2.5, fase: 'Pre-Despesca', tipoRacao: 'Pellet 3.0mm', proteina: 32 },
  { docMin: 111, docMax: 130, taxaAlimentacao: 2, fase: 'Despesca', tipoRacao: 'Pellet 3.0mm', proteina: 32 },
];

// Taxa de crescimento por fase (g/dia), com desaceleracao conforme o
// camarao se aproxima de ~50g (mesmo modelo de frontend/src/models/types.ts
// preverPesoAtual, para manter peso/biomassa consistentes entre telas).
const TAXA_CRESCIMENTO_POR_FASE: { docMax: number; gPorDia: number }[] = [
  { docMax: 15, gPorDia: 0.08 },
  { docMax: 30, gPorDia: 0.15 },
  { docMax: 45, gPorDia: 0.25 },
  { docMax: 60, gPorDia: 0.35 },
  { docMax: 75, gPorDia: 0.4 },
  { docMax: 90, gPorDia: 0.35 },
  { docMax: 110, gPorDia: 0.25 },
  { docMax: Infinity, gPorDia: 0.15 },
];

// Curva de mortalidade acumulada esperada por fase (%), usada como piso
// conservador quando a mortalidade registrada pelo produtor for menor que a
// esperada (mortes nem sempre sao totalmente contabilizadas na prática).
const MORTALIDADE_ESPERADA_POR_FASE: { docMax: number; percentual: number }[] = [
  { docMax: 15, percentual: 5 },
  { docMax: 30, percentual: 8 },
  { docMax: 45, percentual: 12 },
  { docMax: 60, percentual: 18 },
  { docMax: 75, percentual: 25 },
  { docMax: 90, percentual: 32 },
  { docMax: 110, percentual: 38 },
  { docMax: Infinity, percentual: 42 },
];

const PESO_INICIAL_PADRAO_G = 0.1; // peso assumido quando o PL inicial nao e informado

interface RacaoRecomendada {
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

@Injectable()
export class DashboardService {
  constructor(
    private readonly viveirosService: ViveirosService,
    private readonly racaoService: RacaoService,
    private readonly mortalidadeService: MortalidadeService,
  ) {}

  async getFazendaDashboard() {
    const viveiros = await this.viveirosService.findAll();

    const dashboardData = await Promise.all(
      viveiros.map(async (viveiro) => {
        const [racoes, mortalidade] = await Promise.all([
          this.racaoService.findAllByViveiro(viveiro.id),
          this.mortalidadeService.findAllByViveiro(viveiro.id),
        ]);

        const doc = this.calcularDOC(viveiro.data_inicio_ciclo);
        const mortTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0);
        const racaoAcumulada = racoes.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0);

        const recomendado = this.calcularRacaoDiariaAvancada(
          viveiro.densidade,
          viveiro.area,
          doc,
          mortTotal,
        );

        // Biomassa/FCR usam o mesmo peso e populacao estimados da
        // recomendacao (curva de crescimento por DOC), nao um peso fixo de
        // pos-larva — senao a biomassa fica subestimada o ciclo inteiro.
        const biomassa = recomendado.biomassaEstimadaKg;
        const fcr = this.calcularFCR(racaoAcumulada, biomassa);

        const hoje = new Date().toISOString().split('T')[0];
        const registroHoje = racoes.find((r) => r.data === hoje);

        const racaoHojeManha = registroHoje?.qntManha ?? 0;
        const racaoHojeTarde = registroHoje?.qntTarde ?? 0;

        return {
          viveiro: {
            id: viveiro.id,
            nome: viveiro.nome,
            densidade: viveiro.densidade,
            area: viveiro.area,
            data_inicio_ciclo: viveiro.data_inicio_ciclo,
            status: viveiro.status,
          },
          doc,
          racaoHojeTotal: racaoHojeManha + racaoHojeTarde,
          racaoHojeManha,
          racaoHojeTarde,
          recomendadoTotal: recomendado.totalKg,
          recomendadoManha: recomendado.manhaKg,
          recomendadoTarde: recomendado.tardeKg,
          fase: recomendado.fase,
          tipoRacao: recomendado.tipoRacao,
          proteina: recomendado.proteina,
          fcrAtual: fcr,
          racaoAcumulada,
          biomassa,
          alimentouManha: racaoHojeManha > 0,
          alimentouTarde: racaoHojeTarde > 0,
          pesoEstimadoG: recomendado.pesoEstimadoG,
          populacaoEstimada: recomendado.populacaoEstimada,
          biomassaEstimadaKg: recomendado.biomassaEstimadaKg,
        };
      }),
    );

    const totalViveiros = viveiros.length;
    const totais = {
      totalViveiros,
      totalRacaoHoje: dashboardData.reduce((acc, v) => acc + v.racaoHojeTotal, 0),
      totalRecomendado: dashboardData.reduce((acc, v) => acc + v.recomendadoTotal, 0),
      totalBiomassa: dashboardData.reduce((acc, v) => acc + v.biomassa, 0),
      totalRacaoAcumulada: dashboardData.reduce((acc, v) => acc + v.racaoAcumulada, 0),
      fcrMedio: totalViveiros
        ? dashboardData.reduce((acc, v) => acc + v.fcrAtual, 0) / totalViveiros
        : 0,
      viveirosAlimentados: dashboardData.filter((v) => v.alimentouManha && v.alimentouTarde).length,
      viveirosParciais: dashboardData.filter(
        (v) => (v.alimentouManha || v.alimentouTarde) && !(v.alimentouManha && v.alimentouTarde),
      ).length,
      viveirosPendentes: dashboardData.filter((v) => !v.alimentouManha && !v.alimentouTarde).length,
    };

    return {
      viveiros: dashboardData,
      totais,
      atualizado: new Date().toISOString(),
    };
  }

  // Dias de cultivo desde o início do ciclo.
  private calcularDOC(dataInicioCiclo: string): number {
    const inicio = new Date(dataInicioCiclo);
    const hoje = new Date();
    const diffMs = hoje.getTime() - inicio.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  private calcularFCR(racaoTotalKg: number, biomassaKg: number): number {
    if (biomassaKg <= 0) return 0;
    return racaoTotalKg / biomassaKg;
  }

  // População inicial = densidade de estocagem (camarões/m²) x área do
  // viveiro (m²). Densidade sozinha não é uma contagem de indivíduos.
  private calcularPopulacaoInicial(densidade: number, area: number): number {
    return Math.max(0, densidade * area);
  }

  private getFaixaRacao(doc: number): FaixaRacao | null {
    if (!doc || doc <= 0 || doc > 365) return null;
    return TABELA_RACAO.find((f) => doc >= f.docMin && doc <= f.docMax) ?? null;
  }

  // Peso estimado (g) a partir de uma curva de crescimento por fase, com
  // desaceleração conforme o camarão se aproxima do peso de despesca.
  private preverPesoAtual(doc: number, pesoInicialG = PESO_INICIAL_PADRAO_G): number {
    if (doc <= 0) return pesoInicialG;

    let peso = pesoInicialG;
    for (let dia = 1; dia <= doc; dia++) {
      const taxa = TAXA_CRESCIMENTO_POR_FASE.find((f) => dia <= f.docMax)!.gPorDia;
      const fatorReducao = Math.max(0.3, 1 - peso / 50);
      peso += taxa * fatorReducao;
    }
    return Math.round(peso * 100) / 100;
  }

  // População atual considerando a curva de mortalidade esperada como piso
  // conservador (evita superestimar a biomassa quando a mortalidade
  // registrada está incompleta).
  private estimarPopulacaoAtual(densidade: number, area: number, doc: number, mortalidadeTotal: number): number {
    const populacaoInicial = this.calcularPopulacaoInicial(densidade, area);
    const percentualEsperado = MORTALIDADE_ESPERADA_POR_FASE.find((f) => doc <= f.docMax)!.percentual;
    const mortalidadeEsperada = (populacaoInicial * percentualEsperado) / 100;
    const mortalidadeConsiderada = Math.max(mortalidadeTotal, mortalidadeEsperada);
    return Math.max(0, populacaoInicial - mortalidadeConsiderada);
  }

  private calcularRacaoDiariaAvancada(
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

    const faixa = this.getFaixaRacao(doc);
    if (!faixa) return vazio;

    const pesoEstimadoG = this.preverPesoAtual(doc);
    const populacaoEstimada = this.estimarPopulacaoAtual(densidade, area, doc, mortalidadeTotal);
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
}
