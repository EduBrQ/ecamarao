import { useMemo } from 'react';
import { DashboardResponse, FarmStatus } from '../types';
import { calcularScoreSaude } from '../viveiros/services/healthCalculator';

interface UseFarmStatusReturn {
  status: FarmStatus;
  viveirosAlimentados: number;
  viveirosParciais: number;
  viveirosPendentes: number;
}

/**
 * Hook customizado para calcular status geral da fazenda
 * @param dashboard - Dados do dashboard
 * @returns Status calculados da fazenda
 */
export const useFarmStatus = (dashboard: DashboardResponse | null): UseFarmStatusReturn => {
  const status = useMemo(() => {
    if (!dashboard) {
      return {
        status: {
          saudeGeral: 0,
          biomassaTotal: 0,
          racaoHoje: 0,
          recomendadoHoje: 0,
          alertasAtivos: 0
        },
        viveirosAlimentados: 0,
        viveirosParciais: 0,
        viveirosPendentes: 0
      };
    }

    const hoje = new Date().toISOString().split('T')[0];
    
    // Calcular status de alimentação
    const statusViveiros = dashboard.viveiros.reduce((acc, viveiro) => {
      const racaoHoje = viveiro.racoes.find(r => r.data.split('T')[0] === hoje);
      const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
      const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
      
      if (alimentouManha && alimentouTarde) {
        acc.alimentados++;
      } else if (alimentouManha || alimentouTarde) {
        acc.parciais++;
      } else {
        acc.pendentes++;
      }
      
      return acc;
    }, { alimentados: 0, parciais: 0, pendentes: 0 });

    // Calcular saúde geral
    const saudeGeral = dashboard.viveiros.length > 0 ? 
      Math.round(
        dashboard.viveiros.reduce((acc, viveiro) => {
          const scoreSaude = calcularScoreSaude(viveiro);
          return acc + scoreSaude.score;
        }, 0) / dashboard.viveiros.length
      ) : 0;

    // Contar alertas ativos
    const alertasAtivos = dashboard.viveiros.filter(v => {
      const scoreSaude = calcularScoreSaude(v);
      return scoreSaude.status === 'critico' || scoreSaude.status === 'atencao';
    }).length;

    // Calcular totais de ração hoje
    const racaoHoje = dashboard.viveiros.reduce((total, viveiro) => {
      const racaoHojeViveiro = viveiro.racoes.find(r => r.data.split('T')[0] === hoje);
      return total + (racaoHojeViveiro?.total || 0);
    }, 0);

    return {
      status: {
        saudeGeral,
        biomassaTotal: dashboard.totais.totalBiomassa,
        racaoHoje,
        recomendadoHoje: dashboard.totais.totalRecomendado,
        alertasAtivos
      },
      viveirosAlimentados: statusViveiros.alimentados,
      viveirosParciais: statusViveiros.parciais,
      viveirosPendentes: statusViveiros.pendentes
    };
  }, [dashboard]);

  return status;
};
