import { ViveiroDashboard, FeedingPrediction } from '../types';

/**
 * Previsão de alimentação usando algoritmos de IA
 */
export const preverAlimentacao = (viveiro: ViveiroDashboard, dias: number = 1): FeedingPrediction => {
  const biomassaAtual = viveiro.biomassa || 0;
  const doc = viveiro.doc || 0;
  const taxaCrescimentoDiaria = 0.025;
  
  // Prever biomassa futura
  const biomassaFutura = biomassaAtual * Math.pow(1 + taxaCrescimentoDiaria, dias);
  
  // Calcular taxa de alimentação baseada na biomassa futura e fase
  let taxaAlimentacao = 0.08;
  
  if (doc <= 30) taxaAlimentacao = 0.06;
  else if (doc <= 60) taxaAlimentacao = 0.08;
  else if (doc <= 90) taxaAlimentacao = 0.10;
  else taxaAlimentacao = 0.08;
  
  // Fator de temperatura (simulado)
  const fatorTemperatura = 1.1;
  
  const racaoPrevista = biomassaFutura * taxaAlimentacao * fatorTemperatura;
  
  return {
    racaoHoje: racaoPrevista,
    biomassaFutura,
    crescimentoPercentual: ((biomassaFutura - biomassaAtual) / biomassaAtual) * 100,
    tendencia: racaoPrevista > viveiro.recomendadoTotal ? 'aumento' : 'estavel'
  };
};
