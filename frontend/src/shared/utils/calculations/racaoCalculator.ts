interface RacaoCalculatorInput {
  viveiro: {
    id: number;
    nome: string;
    densidade: number;
    area: number;
    data_inicio_ciclo: string;
    status: string;
  };
  doc: number;
  biomassaEstimadaKg: number;
  pesoEstimadoG: number;
  usandoNovaCalculadora: boolean;
}

interface RacaoCalculatorOutput {
  biomassa: number;
  taxaAlimentacao: number;
  racaoManha: number;
  racaoTarde: number;
  racaoTotalDia: number;
  faseCultivo: string;
  faixaPeso: string;
  usandoNovaCalculadora: boolean;
  taxaAlimentacaoDecimal: number;
  pesoMedio: number;
  populacao: number;
  analiseCultivo?: {
    recomendacoes: string[];
    pontosAtencao: string[];
  };
}

/**
 * Calculadora de ração local baseada em parâmetros científicos
 */
export const calcularRacaoLocal = (input: RacaoCalculatorInput): RacaoCalculatorOutput => {
  try {
    // Usar populacaoEstimada do backend se disponível
    let populacaoAtual = 0;
    let pesoMedio = 0;
    
    if (input.pesoEstimadoG > 0) {
      populacaoAtual = (input.biomassaEstimadaKg * 1000) / input.pesoEstimadoG;
      pesoMedio = input.pesoEstimadoG;
    } else {
      // Calcular população e peso baseado no DOC
      const densidade = input.viveiro.densidade;
      const area = input.viveiro.area;
      const populacaoInicial = densidade * area;
      
      // Calcular mortalidade (simulação)
      const mortalidadeTotal = 0; // viria dos dados brutos
      populacaoAtual = Math.max(0, populacaoInicial - mortalidadeTotal);
      
      // Calcular peso médio baseado no DOC
      const doc = input.doc || 0;
      if (doc <= 15) pesoMedio = 0.015 + (doc * 0.00033);
      else if (doc <= 25) pesoMedio = 0.020 + ((doc - 15) * 0.00067);
      else if (doc <= 35) pesoMedio = 0.025 + ((doc - 25) * 0.002);
      else if (doc <= 45) pesoMedio = 0.030 + ((doc - 35) * 0.0015);
      else if (doc <= 60) pesoMedio = 0.040 + ((doc - 45) * 0.002);
      else if (doc <= 75) pesoMedio = 0.050 + ((doc - 60) * 0.004);
      else if (doc <= 90) pesoMedio = 0.100 + ((doc - 75) * 0.067);
      else if (doc <= 105) pesoMedio = 0.133 + ((doc - 90) * 0.067);
      else if (doc <= 120) pesoMedio = 0.200 + ((doc - 105) * 0.067);
      else if (doc <= 135) pesoMedio = 0.133 + ((doc - 120) * 0.067);
      else if (doc <= 150) pesoMedio = 0.200 + ((doc - 135) * 0.04);
      else pesoMedio = 0.600 + ((doc - 150) * 0.02);
    }
    
    // Função auxiliar para determinar fase pelo DOC
    const getFaseByDOC = (doc: number): string => {
      if (doc <= 15) return 'PL15-PL20';
      if (doc <= 25) return 'PL20-PL25';
      if (doc <= 35) return 'PL25-PL30';
      if (doc <= 45) return 'PL30-PL45';
      if (doc <= 60) return 'PL45-PL60';
      if (doc <= 75) return 'PL60-PL75';
      if (doc <= 90) return 'PL75-PL90';
      if (doc <= 105) return 'PL90-PL105';
      if (doc <= 120) return 'PL105-PL120';
      if (doc <= 135) return 'PL120-PL135';
      if (doc <= 150) return 'PL135-PL150';
      return 'PL150+';
    };
    
    // Calcular biomassa
    const biomassa = (populacaoAtual * pesoMedio) / 1000;
    
    // Taxa de alimentação baseada na fase
    let taxaAlimentacao = 0.08;
    if (input.doc <= 30) taxaAlimentacao = 0.06;
    else if (input.doc <= 60) taxaAlimentacao = 0.08;
    else if (input.doc <= 90) taxaAlimentacao = 0.10;
    else taxaAlimentacao = 0.08;
    
    // Calcular ração diária
    const racaoTotalDia = biomassa * taxaAlimentacao;
    const racaoManha = racaoTotalDia * 0.45; // 45% manhã
    const racaoTarde = racaoTotalDia * 0.55; // 55% tarde
    
    return {
      biomassa,
      taxaAlimentacao,
      racaoManha,
      racaoTarde,
      racaoTotalDia,
      faseCultivo: getFaseByDOC(input.doc),
      faixaPeso: `${(pesoMedio * 1000).toFixed(0)}mg`,
      usandoNovaCalculadora: true,
      taxaAlimentacaoDecimal: taxaAlimentacao,
      pesoMedio,
      populacao: populacaoAtual
    };
  } catch (error) {
    console.error('Erro no cálculo local:', error);
    throw error;
  }
};
