import { Injectable } from '@nestjs/common';
import { ViveirosService } from '../viveiros/viveiros.service';
import { RacaoService } from '../racao/racao.service';
import { MortalidadeService } from '../mortalidade/mortalidade.service';

const PESO_MEDIO_PADRAO_G = 0.015; // 15g estimado (peso de PL — pós-larva)

interface RacaoRecomendada {
  fase: string;
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
        const biomassa = this.calcularBiomassa(viveiro.densidade, mortTotal, PESO_MEDIO_PADRAO_G);
        const fcr = this.calcularFCR(racaoAcumulada, biomassa);

        const hoje = new Date().toISOString().split('T')[0];
        const registroHoje = racoes.find((r) => r.data === hoje);

        const recomendado = this.calcularRacaoDiariaAvancada(
          viveiro.densidade,
          doc,
          mortTotal,
        );

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

  // densidade é em "mil larvas" (ver Viveiro.densidade); mortalidadeTotal em unidades.
  private calcularBiomassa(densidade: number, mortalidadeTotal: number, pesoMedioG: number): number {
    const vivos = densidade * 1000 - mortalidadeTotal;
    return Math.max(0, (vivos * pesoMedioG) / 1000);
  }

  private calcularFCR(racaoTotalKg: number, biomassaKg: number): number {
    if (biomassaKg <= 0) return 0;
    return racaoTotalKg / biomassaKg;
  }

  // Curva de crescimento simplificada (PL a 0.015g até 30g em 120 dias) e
  // taxa de alimentação por fase do ciclo.
  private calcularRacaoDiariaAvancada(
    densidade: number,
    doc: number,
    mortalidadeTotal: number,
  ): RacaoRecomendada {
    const populacaoEstimada = densidade * 1000 - mortalidadeTotal;

    const crescimentoDiario = (30 - 0.015) / 120;
    const pesoEstimadoG = doc > 0 ? Math.min(0.015 + crescimentoDiario * doc, 30) : 0.015;

    const biomassaEstimadaKg = (populacaoEstimada * pesoEstimadoG) / 1000;

    let fase = 'Berçário';
    let taxaAlimentacao = 10;
    if (doc >= 31 && doc <= 60) {
      fase = 'Engorda I';
      taxaAlimentacao = 8;
    } else if (doc >= 61 && doc <= 90) {
      fase = 'Engorda II';
      taxaAlimentacao = 6;
    } else if (doc > 90) {
      fase = 'Engorda III';
      taxaAlimentacao = 4;
    }

    const totalKg = (biomassaEstimadaKg * taxaAlimentacao) / 100;

    return {
      fase,
      taxaAlimentacao,
      pesoEstimadoG,
      populacaoEstimada,
      biomassaEstimadaKg,
      totalKg,
      manhaKg: totalKg * 0.4,
      tardeKg: totalKg * 0.6,
    };
  }
}
