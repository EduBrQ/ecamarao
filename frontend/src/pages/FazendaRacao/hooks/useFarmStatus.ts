import { useMemo } from 'react';
import { DashboardResponse, FeedingStatus } from '../types/dashboard';
import { calcularSaudeGeral } from '../services/healthCalculator';

interface UseFarmStatusReturn {
  viveirosAlimentados: number;
  viveirosParciais: number;
  viveirosPendentes: number;
  saudeGeral: number;
  fcrMedio: number;
}

/**
 * Hook customizado para calcular status da fazenda
 * @param dashboard - Dados do dashboard
 * @returns Status calculados da fazenda
 */
export const useFarmStatus = (dashboard: DashboardResponse | null): UseFarmStatusReturn => {
  const status = useMemo(() => {
    if (!dashboard) {
      return {
        viveirosAlimentados: 0,
        viveirosParciais: 0,
        viveirosPendentes: 0,
        saudeGeral: 0,
        fcrMedio: 0
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

    // Calcular FCR médio
    let totalFCR = 0;
    let viveirosComFCR = 0;
    dashboard.viveiros.forEach(viveiro => {
      if (viveiro.fcrAtual > 0) {
        totalFCR += viveiro.fcrAtual;
        viveirosComFCR++;
      }
    });

    const fcrMedioCalculado = viveirosComFCR > 0 ? totalFCR / viveirosComFCR : 0;

    return {
      viveirosAlimentados: statusViveiros.alimentados,
      viveirosParciais: statusViveiros.parciais,
      viveirosPendentes: statusViveiros.pendentes,
      saudeGeral: calcularSaudeGeral(dashboard.viveiros),
      fcrMedio: fcrMedioCalculado
    };
  }, [dashboard]);

  return status;
};
