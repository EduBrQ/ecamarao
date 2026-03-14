/**
 * Sistema de Cálculo de Ração para Litopenaeus vannamei
 * 
 * Baseado em melhores práticas de aquicultura e literatura científica
 * para cultivo de camarão marinho em viveiros.
 */

// Tipos para o sistema de cálculo
export interface ParametrosViveiro {
  quantidadeCamaroes: number;
  pesoMedioGramas: number;
  doc?: number; // DOC opcional para cálculo mais preciso
}

export interface TaxaAlimentacao {
  faixaPeso: string;
  taxaPercentual: number;
  faseCultivo: string;
}

export interface ResultadoCalculoRacao {
  biomassa: number;           // Biomassa total em kg
  taxaAlimentacao: number;    // Taxa como decimal (ex: 0.20 para 20%)
  racaoManha: number;         // Ração manhã em kg
  racaoTarde: number;         // Ração tarde em kg
  racaoTotalDia: number;      // Total diário em kg
  faseCultivo: string;        // Fase atual do cultivo
  faixaPeso: string;          // Faixa de peso atual
}

export interface ConfiguracaoArracoamento {
  periodos: number;           // Número de períodos de alimentação
  distribuicao: number[];     // Percentual por período (ex: [50, 50] para 2 períodos)
  nomesPeriodos: string[];    // Nomes dos períodos (ex: ['Manhã', 'Tarde'])
}

/**
 * Tabela de taxas de alimentação baseada em peso médio
 * Valores baseados em literatura científica e práticas comerciais
 * para Litopenaeus vannamei
 */
const TABELA_TAXAS_ALIMENTACAO: TaxaAlimentacao[] = [
  {
    faixaPeso: '0.01 – 0.05g',
    taxaPercentual: 20,
    faseCultivo: 'Pós-larva (PL15-PL25)'
  },
  {
    faixaPeso: '0.05 – 0.5g',
    taxaPercentual: 15,
    faseCultivo: 'Berçário I'
  },
  {
    faixaPeso: '0.5 – 2g',
    taxaPercentual: 10,
    faseCultivo: 'Berçário II'
  },
  {
    faixaPeso: '2 – 5g',
    taxaPercentual: 6,
    faseCultivo: 'Engorda I'
  },
  {
    faixaPeso: '5 – 10g',
    taxaPercentual: 4,
    faseCultivo: 'Engorda II'
  },
  {
    faixaPeso: '10 – 20g',
    taxaPercentual: 3,
    faseCultivo: 'Engorda III'
  },
  {
    faixaPeso: '20g+',
    taxaPercentual: 2,
    faseCultivo: 'Engorda Final / Abate'
  }
];

/**
 * Configurações padrão para distribuição da ração
 */
const CONFIGURACOES_ARRACOAMENTO: Record<string, ConfiguracaoArracoamento> = {
  '2_periodos': {
    periodos: 2,
    distribuicao: [50, 50],
    nomesPeriodos: ['Manhã', 'Tarde']
  },
  '4_periodos': {
    periodos: 4,
    distribuicao: [25, 25, 25, 25],
    nomesPeriodos: ['Manhã', 'Meio-dia', 'Tarde', 'Noite']
  }
};

/**
 * Classe para validação de parâmetros de entrada
 */
class ValidadorParametros {
  static validar(parametros: ParametrosViveiro): void {
    const { quantidadeCamaroes, pesoMedioGramas, doc } = parametros;
    
    if (!quantidadeCamaroes || quantidadeCamaroes <= 0) {
      throw new Error('Quantidade de camarões deve ser um número positivo maior que zero');
    }
    
    if (!pesoMedioGramas || pesoMedioGramas <= 0) {
      throw new Error('Peso médio deve ser um número positivo maior que zero');
    }
    
    if (quantidadeCamaroes > 1000000) {
      throw new Error('Quantidade de camarões parece muito alta (máximo recomendado: 1.000.000)');
    }
    
    if (pesoMedioGramas > 50) {
      throw new Error('Peso médio parece muito alto (máximo recomendado: 50g)');
    }
    
    if (quantidadeCamaroes < 1000) {
      console.warn('Aviso: Quantidade de camarões muito baixa para cultivo comercial');
    }
    
    if (pesoMedioGramas < 0.01) {
      console.warn('Aviso: Peso médio muito baixo, possivelmente fase de pós-larva inicial');
    }
    
    if (doc !== undefined && (doc < 0 || doc > 365)) {
      console.warn('Aviso: DOC fora do range esperado (0-365 dias)');
    }
  }
}

/**
 * Classe principal para cálculo de ração
 */
export class CalculadoraRacao {
  
  /**
   * Calcula a biomassa total do viveiro
   * @param quantidadeCamaroes Número de camarões no viveiro
   * @param pesoMedioGramas Peso médio individual em gramas
   * @returns Biomassa total em quilogramas
   */
  static calcularBiomassa(quantidadeCamaroes: number, pesoMedioGramas: number): number {
    // Converter para kg: (quantidade × peso em gramas) / 1000
    const biomassaGramas = quantidadeCamaroes * pesoMedioGramas;
    const biomassaKg = biomassaGramas / 1000;
    
    // Não arredondar para valores muito pequenos - manter precisão
    return Number(biomassaKg.toFixed(4));
  }
  
  /**
   * Determina a taxa de alimentação baseada no DOC (Dias de Ciclo)
   * Baseado em fontes científicas para Litopenaeus vannamei
   * Referências: 
   * - Tacon (2019) - Nutrition of Litopenaeus vannamei
   * - Aquaculture Stewardship Council guidelines
   * - FAO Technical Guidelines
   * @param doc Dias de ciclo do cultivo
   * @returns Objeto com taxa e informações da fase
   */
  static determinarTaxaAlimentacaoPorDOC(doc: number): TaxaAlimentacao {
    // Tabela baseada em literatura científica para L. vannamei
    if (doc <= 15) {
      return {
        faixaPeso: '0.01 – 0.05g',
        taxaPercentual: 20,
        faseCultivo: 'Pós-larva (PL15-PL25)'
      };
    } else if (doc <= 25) {
      return {
        faixaPeso: '0.05 – 0.5g',
        taxaPercentual: 15,
        faseCultivo: 'Berçário I'
      };
    } else if (doc <= 35) {
      return {
        faixaPeso: '0.5 – 2g',
        taxaPercentual: 10,
        faseCultivo: 'Berçário II'
      };
    } else if (doc <= 45) {
      return {
        faixaPeso: '2 – 5g',
        taxaPercentual: 6,
        faseCultivo: 'Engorda I'
      };
    } else if (doc <= 60) {
      return {
        faixaPeso: '5 – 10g',
        taxaPercentual: 4,
        faseCultivo: 'Engorda II'
      };
    } else if (doc <= 75) {
      return {
        faixaPeso: '10 – 15g',
        taxaPercentual: 3.5,
        faseCultivo: 'Engorda III'
      };
    } else if (doc <= 90) {
      return {
        faixaPeso: '15 – 20g',
        taxaPercentual: 3,
        faseCultivo: 'Engorda Final'
      };
    } else {
      return {
        faixaPeso: '20g+',
        taxaPercentual: 2.5,
        faseCultivo: 'Abate'
      };
    }
  }

  /**
   * Determina a taxa de alimentação baseada no peso médio (método legado)
   * @param pesoMedioGramas Peso médio dos camarões em gramas
   * @returns Objeto com taxa e informações da fase
   */
  static determinarTaxaAlimentacao(pesoMedioGramas: number): TaxaAlimentacao {
    // Buscar a faixa correta na tabela
    const faixa = TABELA_TAXAS_ALIMENTACAO.find(taxa => {
      // Extrair valores mínimos e máximos da faixa
      const faixaPeso = taxa.faixaPeso;
      
      // Verificar se é uma faixa com " – " ou um valor único com "+"
      if (faixaPeso.includes(' – ')) {
        const [minStr, maxStr] = faixaPeso.split(' – ');
        const min = parseFloat(minStr.replace('g', ''));
        const max = maxStr.includes('+') ? Infinity : parseFloat(maxStr.replace('g', ''));
        return pesoMedioGramas >= min && pesoMedioGramas <= max;
      } else if (faixaPeso.includes('+')) {
        // Caso como "20g+" - tratar como mínimo até infinito
        const min = parseFloat(faixaPeso.replace('g+', ''));
        return pesoMedioGramas >= min;
      } else {
        // Caso de valor único (não deveria acontecer, mas por segurança)
        const valor = parseFloat(faixaPeso.replace('g', ''));
        return Math.abs(pesoMedioGramas - valor) < 0.01; // Tolerância de 0.01g
      }
    });
    
    if (!faixa) {
      throw new Error(`Não foi possível determinar taxa de alimentação para peso: ${pesoMedioGramas}g`);
    }
    
    return faixa;
  }
  
  /**
   * Calcula a ração diária total
   * @param biomassa Biomassa total em kg
   * @param taxaPercentual Taxa de alimentação como percentual (ex: 20 para 20%)
   * @returns Ração diária total em kg
   */
  static calcularRacaoDiariaTotal(biomassa: number, taxaPercentual: number): number {
    // Converter taxa para decimal e calcular
    const taxaDecimal = taxaPercentual / 100;
    const racaoTotal = biomassa * taxaDecimal;
    
    // Manter precisão para valores pequenos
    return Number(racaoTotal.toFixed(4));
  }
  
  /**
   * Distribui a ração total pelos períodos do dia
   * @param racaoTotal Total diário de ração em kg
   * @param configuracao Configuração de distribuição (padrão: 2 períodos 50/50)
   * @returns Array com ração por período
   */
  static distribuirRacaoPorPeriodo(
    racaoTotal: number, 
    configuracao: ConfiguracaoArracoamento = CONFIGURACOES_ARRACOAMENTO['2_periodos']
  ): number[] {
    const racoesPorPeriodo: number[] = [];
    
    for (let i = 0; i < configuracao.periodos; i++) {
      const percentual = configuracao.distribuicao[i] / 100;
      const racaoPeriodo = racaoTotal * percentual;
      racoesPorPeriodo.push(Number(racaoPeriodo.toFixed(4)));
    }
    
    return racoesPorPeriodo;
  }
  
  /**
   * Função principal que calcula toda a ração diária
   * @param parametros Parâmetros do viveiro
   * @param configuracaoArracoamento Configuração de períodos (opcional)
   * @returns Resultado completo do cálculo
   */
  static calcularRacaoDiaria(
    parametros: ParametrosViveiro,
    configuracaoArracoamento?: ConfiguracaoArracoamento
  ): ResultadoCalculoRacao {
    
    // 1. Validação dos parâmetros
    ValidadorParametros.validar(parametros);
    
    const { quantidadeCamaroes, pesoMedioGramas, doc } = parametros;
    
    // 2. Cálculo da biomassa
    const biomassa = this.calcularBiomassa(quantidadeCamaroes, pesoMedioGramas);
    
    // 3. Determinação da taxa de alimentação (priorizar DOC)
    let taxaInfo: TaxaAlimentacao;
    if (doc !== undefined && doc >= 0) {
      // Usar método baseado em DOC (mais preciso)
      taxaInfo = this.determinarTaxaAlimentacaoPorDOC(doc);
    } else {
      // Fallback para método baseado em peso
      taxaInfo = this.determinarTaxaAlimentacao(pesoMedioGramas);
    }
    
    // 4. Cálculo da ração diária total
    const racaoTotalDia = this.calcularRacaoDiariaTotal(biomassa, taxaInfo.taxaPercentual);
    
    // 5. Distribuição pelos períodos (padrão: 2 períodos)
    const config = configuracaoArracoamento || CONFIGURACOES_ARRACOAMENTO['2_periodos'];
    const racoesPorPeriodo = this.distribuirRacaoPorPeriodo(racaoTotalDia, config);
    
    // 6. Montagem do resultado
    const resultado: ResultadoCalculoRacao = {
      biomassa,
      taxaAlimentacao: taxaInfo.taxaPercentual / 100, // Converter para decimal
      racaoManha: racoesPorPeriodo[0] || 0,
      racaoTarde: racoesPorPeriodo[1] || 0,
      racaoTotalDia,
      faseCultivo: taxaInfo.faseCultivo,
      faixaPeso: taxaInfo.faixaPeso
    };
    
    return resultado;
  }
  
  /**
   * Calcula o total recomendado para múltiplos viveiros
   * @param viveiros Array com dados dos viveiros
   * @returns Objeto com totais calculados
   */
  static calcularTotalRecomendado(viveiros: any[]): {
    totalRecomendado: number;
    totalManha: number;
    totalTarde: number;
    totalBiomassa: number;
  } {
    let totalRecomendado = 0;
    let totalManha = 0;
    let totalTarde = 0;
    let totalBiomassa = 0;

    viveiros.forEach(viveiro => {
      if (viveiro.recomendadoTotal) {
        totalRecomendado += viveiro.recomendadoTotal;
        totalManha += viveiro.recomendadoManha || 0;
        totalTarde += viveiro.recomendadoTarde || 0;
      }
      if (viveiro.biomassa) {
        totalBiomassa += viveiro.biomassa;
      }
    });

    return {
      totalRecomendado: Number(totalRecomendado.toFixed(2)),
      totalManha: Number(totalManha.toFixed(2)),
      totalTarde: Number(totalTarde.toFixed(2)),
      totalBiomassa: Number(totalBiomassa.toFixed(3))
    };
  }

  /**
   * Versão estendida para múltiplos períodos
   * @param parametros Parâmetros do viveiro
   * @param numeroPeriodos Número de períodos de alimentação
   * @returns Resultado com todos os períodos
   */
  static calcularRacaoMultiPeriodos(
    parametros: ParametrosViveiro,
    numeroPeriodos: number = 2
  ): ResultadoCalculoRacao & { racoesPorPeriodo: { nome: string; quantidade: number }[] } {
    
    const configChave = numeroPeriodos === 4 ? '4_periodos' : '2_periodos';
    const config = CONFIGURACOES_ARRACOAMENTO[configChave];
    
    if (!config) {
      throw new Error(`Configuração para ${numeroPeriodos} períodos não encontrada`);
    }
    
    const resultadoBase = this.calcularRacaoDiaria(parametros, config);
    const racoesPorPeriodo = this.distribuirRacaoPorPeriodo(resultadoBase.racaoTotalDia, config);
    
    const racoesDetalhadas = racoesPorPeriodo.map((quantidade, index) => ({
      nome: config.nomesPeriodos[index],
      quantidade
    }));
    
    return {
      ...resultadoBase,
      racoesPorPeriodo: racoesDetalhadas
    };
  }
  
  /**
   * Função de análise e recomendações
   * @param parametros Parâmetros do viveiro
   * @returns Análise detalhada e recomendações
   */
  static analisarCultivo(parametros: ParametrosViveiro): {
    analise: string;
    recomendacoes: string[];
    pontosAtencao: string[];
  } {
    const { quantidadeCamaroes, pesoMedioGramas } = parametros;
    const resultado = this.calcularRacaoDiaria(parametros);
    
    const analise: string[] = [];
    const recomendacoes: string[] = [];
    const pontosAtencao: string[] = [];
    
    // Análise da densidade
    const densidadePorM2 = quantidadeCamaroes / 1000; // Assumindo 1000m² padrão
    if (densidadePorM2 > 100) {
      pontosAtencao.push('Alta densidade de cultivo - monitorar qualidade da água');
      recomendacoes.push('Considerar aeracao adicional e trocas de água mais frequentes');
    } else if (densidadePorM2 < 20) {
      pontosAtencao.push('Baixa densidade - possível subutilização do viveiro');
      recomendacoes.push('Considerar aumento da densidade para melhor rentabilidade');
    }
    
    // Análise da fase
    if (pesoMedioGramas < 0.5) {
      recomendacoes.push('Fase inicial - oferecer ração de alta proteína (45-50%)');
      recomendacoes.push('Monitorar sobrevivência diariamente');
    } else if (pesoMedioGramas > 20) {
      recomendacoes.push('Próximo ao peso de abate - planejar colheita');
      recomendacoes.push('Considerar redução da taxa para melhor FCR final');
    }
    
    // Análise da ração
    if (resultado.racaoTotalDia > 100) {
      recomendacoes.push('Alta demanda de ração - verificar capacidade de armazenamento');
    }
    
    analise.push(`Cultivo em fase de ${resultado.faseCultivo}`);
    analise.push(`Biomassa total: ${resultado.biomassa} kg`);
    analise.push(`Taxa de alimentação: ${(resultado.taxaAlimentacao * 100).toFixed(1)}% da biomassa`);
    
    return {
      analise: analise.join('. '),
      recomendacoes,
      pontosAtencao
    };
  }
}

/**
 * Função de uso rápido para o caso mais comum (2 períodos)
 */
export function calcularRacaoSimples(
  quantidadeCamaroes: number,
  pesoMedioGramas: number
): ResultadoCalculoRacao {
  return CalculadoraRacao.calcularRacaoDiaria({
    quantidadeCamaroes,
    pesoMedioGramas
  });
}

/**
 * Exemplos de uso:
 */
export const EXEMPLOS_USO = {
  exemplo1: {
    descricao: "Cultivo inicial (pós-larva)",
    parametros: { quantidadeCamaroes: 100000, pesoMedioGramas: 0.03 },
    resultado: calcularRacaoSimples(100000, 0.03)
  },
  exemplo2: {
    descricao: "Cultivo em engorda",
    parametros: { quantidadeCamaroes: 80000, pesoMedioGramas: 8.5 },
    resultado: calcularRacaoSimples(80000, 8.5)
  },
  exemplo3: {
    descricao: "Cultivo próximo ao abate",
    parametros: { quantidadeCamaroes: 60000, pesoMedioGramas: 22.0 },
    resultado: calcularRacaoSimples(60000, 22.0)
  }
};

// Exportar tudo para uso em outros módulos
export default CalculadoraRacao;
