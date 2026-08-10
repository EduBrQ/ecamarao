import { Injectable } from '@nestjs/common';
import { ViveirosService } from '../viveiros/viveiros.service';
import { RacaoService } from '../racao/racao.service';
import { MortalidadeService } from '../mortalidade/mortalidade.service';
import { calcularDOC, calcularFCR, calcularRacaoDiariaAvancada } from '../common/racao-model';

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

        const doc = calcularDOC(viveiro.data_inicio_ciclo);
        const mortTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0);
        const racaoAcumulada = racoes.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0);

        const recomendado = calcularRacaoDiariaAvancada(
          viveiro.densidade,
          viveiro.area,
          doc,
          mortTotal,
        );

        // Biomassa/FCR usam o mesmo peso e populacao estimados da
        // recomendacao (curva de crescimento por DOC), nao um peso fixo de
        // pos-larva — senao a biomassa fica subestimada o ciclo inteiro.
        const biomassa = recomendado.biomassaEstimadaKg;
        const fcr = calcularFCR(racaoAcumulada, biomassa);

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
}
