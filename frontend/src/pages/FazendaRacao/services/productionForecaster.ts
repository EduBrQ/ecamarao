import { ViveiroDashboard, ProductionForecast } from '../types/dashboard';

/**
 * Gera previsão de produção baseada nos dados atuais do viveiro
 * @param viveiro - Dados do viveiro para previsão
 * @returns Previsão de produção detalhada
 */
export const preverProducao = (viveiro: ViveiroDashboard): ProductionForecast => {
  const doc = viveiro.doc || 0;
  const biomassaAtual = viveiro.biomassa || 0;
  
  // Peso médio estimado baseado em curva de crescimento
  let pesoMedioEstimado = 0;
  if (doc <= 30) pesoMedioEstimado = 0.02;
  else if (doc <= 60) pesoMedioEstimado = 0.08;
  else if (doc <= 90) pesoMedioEstimado = 0.15;
  else if (doc <= 120) pesoMedioEstimado = 0.25;
  else pesoMedioEstimado = 0.35;
  
  // Taxa de crescimento diária
  const taxaCrescimentoDiaria = 0.018; // 1.8% ao dia
  
  // Dias até atingir peso de colheita (25g)
  const diasAteColheita = Math.max(0, Math.ceil(Math.log(25 / pesoMedioEstimado) / Math.log(1 + taxaCrescimentoDiaria)));
  
  // Prever biomassa na colheita
  const biomassaColheita = biomassaAtual * Math.pow(1 + taxaCrescimentoDiaria, diasAteColheita);
  
  // Data estimada de colheita
  const dataColheita = new Date();
  dataColheita.setDate(dataColheita.getDate() + diasAteColheita);
  
  return {
    pesoMedioEstimado: parseFloat(pesoMedioEstimado.toFixed(2)),
    producaoEstimada: parseFloat(biomassaColheita.toFixed(0)),
    dataColheita,
    diasAteColheita
  };
};
