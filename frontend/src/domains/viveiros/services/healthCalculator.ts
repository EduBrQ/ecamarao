import { ViveiroDashboard } from '../types';

export interface HealthScore {
  score: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  cor: string;
  fatores: {
    fcr: number;
    crescimento: number;
    consistencia: number;
    sobrevivencia: number;
  };
}

/**
 * Calcula o score de saúde do viveiro baseado em múltiplos fatores
 * @param viveiro - Dados do viveiro para análise
 * @returns Score de saúde com detalhes
 */
export const calcularScoreSaude = (viveiro: ViveiroDashboard): HealthScore => {
  // Score FCR (0-30 pontos)
  let scoreFCR = 0;
  if (viveiro.fcrAtual > 0) {
    if (viveiro.fcrAtual < 1.5) scoreFCR = 30;
    else if (viveiro.fcrAtual < 1.8) scoreFCR = 25;
    else if (viveiro.fcrAtual < 2.0) scoreFCR = 20;
    else if (viveiro.fcrAtual < 2.5) scoreFCR = 10;
    else scoreFCR = 0;
  }
  
  // Score Crescimento (0-25 pontos)
  const biomassaEsperada = viveiro.populacaoEstimada * 0.015; // 15g por camarão
  const crescimentoReal = viveiro.biomassa / biomassaEsperada;
  const scoreCrescimento = Math.min(25, crescimentoReal * 25);
  
  // Score Consistência (0-25 pontos)
  let scoreConsistencia = 15; // Base
  const diasUltimos7 = viveiro.racoes.slice(-7);
  if (diasUltimos7.length >= 5) {
    const mediaConsumo = diasUltimos7.reduce((sum: number, r: any) => sum + r.total, 0) / diasUltimos7.length;
    const variacao = diasUltimos7.reduce((sum: number, r: any) => sum + Math.abs(r.total - mediaConsumo), 0) / diasUltimos7.length;
    scoreConsistencia = Math.max(0, 25 - (variacao * 5));
  }
  
  // Score Sobrevivência (0-20 pontos)
  let scoreSobrevivencia = 15; // Base
  if (viveiro.populacaoEstimada && viveiro.viveiro.densidade && viveiro.viveiro.area) {
    const populacaoInicial = viveiro.viveiro.densidade * viveiro.viveiro.area;
    const taxaSobrevivencia = viveiro.populacaoEstimada / populacaoInicial;
    scoreSobrevivencia = Math.min(20, taxaSobrevivencia * 20);
  }
  
  const scoreTotal = scoreFCR + scoreCrescimento + scoreConsistencia + scoreSobrevivencia;
  
  let status: HealthScore['status'];
  let cor: string;
  
  if (scoreTotal >= 85) {
    status = 'excelente';
    cor = '#10b981';
  } else if (scoreTotal >= 70) {
    status = 'bom';
    cor = '#22c55e';
  } else if (scoreTotal >= 50) {
    status = 'atencao';
    cor = '#f59e0b';
  } else {
    status = 'critico';
    cor = '#ef4444';
  }
  
  return {
    score: Math.round(scoreTotal),
    status,
    cor,
    fatores: {
      fcr: scoreFCR,
      crescimento: scoreCrescimento,
      consistencia: scoreConsistencia,
      sobrevivencia: scoreSobrevivencia
    }
  };
};
