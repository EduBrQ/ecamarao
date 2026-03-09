/**
 * Integração da Calculadora de Ração com o Sistema EcoMarão
 * 
 * Este arquivo mostra como integrar a nova calculadora de ração
 * com o sistema existente, substituindo os cálculos atuais.
 */

import { CalculadoraRacao, calcularRacaoSimples } from './CalculadoraRacao';

/**
 * Interface para compatibilidade com o sistema existente
 */
export interface ViveiroDados {
  id: number;
  nome: string;
  densidade: number; // larvas/m²
  area: number; // m²
  data_inicio_ciclo: string;
  peso_medio?: number; // gramas (opcional)
  mortalidade_registrada?: number; // total de mortalidade
}

/**
 * Interface para resultado compatível com frontend
 */
export interface ResultadoRacaoSistema {
  // Campos existentes no sistema
  totalKg: number;
  manhaKg: number;
  tardeKg: number;
  pesoEstimadoG: number;
  populacaoEstimada: number;
  biomassaEstimadaKg: number;
  fase: string;
  taxaAlimentacao: number;
  
  // Novos campos da calculadora
  faixaPeso: string;
  faseCultivo: string;
  taxaAlimentacaoDecimal: number;
  
  // Metadados
  usandoNovaCalculadora: boolean;
  dataCalculo: string;
}

/**
 * Classe adaptadora para integrar a nova calculadora
 */
export class AdaptadorCalculadoraRacao {
  
  /**
   * Converte dados do viveiro do sistema para parâmetros da calculadora
   */
  static converterParaParametros(viveiro: ViveiroDados): {
    quantidadeCamaroes: number;
    pesoMedioGramas: number;
  } {
    // Calcular população estimada
    const populacaoInicial = viveiro.densidade * viveiro.area;
    const mortalidade = viveiro.mortalidade_registrada || 0;
    const populacaoAtual = Math.max(0, populacaoInicial - mortalidade);
    
    // Determinar peso médio
    let pesoMedio = viveiro.peso_medio;
    
    // Se não tiver peso registrado, estimar baseado no DOC
    if (!pesoMedio) {
      const doc = this.calcularDOC(viveiro.data_inicio_ciclo);
      pesoMedio = this.estimarPesoPorDOC(doc);
    }
    
    return {
      quantidadeCamaroes: populacaoAtual,
      pesoMedioGramas: pesoMedio
    };
  }
  
  /**
   * Calcula o Days of Culture (DOC)
   */
  static calcularDOC(dataInicio: string): number {
    const inicio = new Date(dataInicio);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Estima peso baseado no DOC (curva de crescimento padrão)
   */
  static estimarPesoPorDOC(doc: number): number {
    if (doc <= 0) return 0.015; // PL padrão
    
    if (doc <= 30) {
      // Berçário: crescimento mais lento inicial
      return 0.015 + (doc * 0.35);
    } else if (doc <= 60) {
      // Engorda I: crescimento acelerado
      return 10.5 + ((doc - 30) * 0.5);
    } else if (doc <= 90) {
      // Engorda II: crescimento moderado
      return 25.5 + ((doc - 60) * 0.35);
    } else {
      // Engorda III: crescimento desacelerando
      return 36 + ((doc - 90) * 0.2);
    }
  }
  
  /**
   * Calcula ração usando a nova calculadora e adapta para o formato do sistema
   */
  static calcularRacaoParaSistema(viveiro: ViveiroDados): ResultadoRacaoSistema {
    try {
      // 1. Converter parâmetros
      const parametros = this.converterParaParametros(viveiro);
      
      // 2. Usar nova calculadora
      const resultadoCalculadora = CalculadoraRacao.calcularRacaoDiaria(parametros);
      
      // 3. Adaptar para formato do sistema
      const resultadoSistema: ResultadoRacaoSistema = {
        // Campos existentes (mantidos para compatibilidade)
        totalKg: resultadoCalculadora.racaoTotalDia,
        manhaKg: resultadoCalculadora.racaoManha,
        tardeKg: resultadoCalculadora.racaoTarde,
        pesoEstimadoG: parametros.pesoMedioGramas,
        populacaoEstimada: parametros.quantidadeCamaroes,
        biomassaEstimadaKg: resultadoCalculadora.biomassa,
        fase: resultadoCalculadora.faseCultivo,
        taxaAlimentacao: resultadoCalculadora.taxaAlimentacao * 100, // Converter para percentual
        
        // Novos campos
        faixaPeso: resultadoCalculadora.faixaPeso,
        faseCultivo: resultadoCalculadora.faseCultivo,
        taxaAlimentacaoDecimal: resultadoCalculadora.taxaAlimentacao,
        
        // Metadados
        usandoNovaCalculadora: true,
        dataCalculo: new Date().toISOString()
      };
      
      return resultadoSistema;
      
    } catch (error) {
      console.error('Erro no cálculo de ração:', error);
      
      // Fallback para cálculo antigo simplificado
      return this.calcularRacaoFallback(viveiro);
    }
  }
  
  /**
   * Fallback para cálculo antigo em caso de erro
   */
  private static calcularRacaoFallback(viveiro: ViveiroDados): ResultadoRacaoSistema {
    const parametros = this.converterParaParametros(viveiro);
    const biomassa = (parametros.quantidadeCamaroes * parametros.pesoMedioGramas) / 1000;
    
    // Taxa simplificada baseada no peso
    let taxa = 10; // padrão 10%
    if (parametros.pesoMedioGramas <= 0.5) taxa = 15;
    else if (parametros.pesoMedioGramas <= 2) taxa = 10;
    else if (parametros.pesoMedioGramas <= 5) taxa = 6;
    else if (parametros.pesoMedioGramas <= 10) taxa = 4;
    else taxa = 3;
    
    const totalKg = (biomassa * taxa) / 100;
    
    return {
      totalKg,
      manhaKg: totalKg * 0.4,
      tardeKg: totalKg * 0.6,
      pesoEstimadoG: parametros.pesoMedioGramas,
      populacaoEstimada: parametros.quantidadeCamaroes,
      biomassaEstimadaKg: biomassa,
      fase: 'Não determinada',
      taxaAlimentacao: taxa,
      faixaPeso: 'Não calculada',
      faseCultivo: 'Não determinada',
      taxaAlimentacaoDecimal: taxa / 100,
      usandoNovaCalculadora: false,
      dataCalculo: new Date().toISOString()
    };
  }
  
  /**
   * Compara resultados entre calculadora antiga e nova
   */
  static compararCalculadoras(viveiro: ViveiroDados): {
    antigo: ResultadoRacaoSistema;
    novo: ResultadoRacaoSistema;
    diferencaPercentual: number;
    recomendacao: string;
  } {
    const resultadoAntigo = this.calcularRacaoFallback(viveiro);
    const resultadoNovo = this.calcularRacaoParaSistema(viveiro);
    
    const diferenca = resultadoNovo.totalKg - resultadoAntigo.totalKg;
    const diferencaPercentual = (diferenca / resultadoAntigo.totalKg) * 100;
    
    let recomendacao = 'Manter cálculo atual';
    if (Math.abs(diferencaPercentual) > 10) {
      recomendacao = diferencaPercentual > 0 ? 
        'Nova calculadora recomenda mais ração - avaliar necessidade' :
        'Nova calculadora recomenda menos ração - potencial economia';
    }
    
    return {
      antigo: resultadoAntigo,
      novo: resultadoNovo,
      diferencaPercentual,
      recomendacao
    };
  }
  
  /**
   * Gera relatório detalhado do viveiro
   */
  static gerarRelatorioViveiro(viveiro: ViveiroDados): {
    dadosBasicos: any;
    calculoRacao: ResultadoRacaoSistema;
    analiseCultivo: any;
    recomendacoes: string[];
    pontosAtencao: string[];
  } {
    const resultado = this.calcularRacaoParaSistema(viveiro);
    const analise = CalculadoraRacao.analisarCultivo({
      quantidadeCamaroes: resultado.populacaoEstimada,
      pesoMedioGramas: resultado.pesoEstimadoG
    });
    
    return {
      dadosBasicos: {
        nome: viveiro.nome,
        area: viveiro.area,
        densidade: viveiro.densidade,
        doc: this.calcularDOC(viveiro.data_inicio_ciclo),
        dataInicio: viveiro.data_inicio_ciclo
      },
      calculoRacao: resultado,
      analiseCultivo: analise,
      recomendacoes: analise.recomendacoes,
      pontosAtencao: analise.pontosAtencao
    };
  }
}

/**
 * Função de migração para atualizar sistema
 */
export function migrarParaNovaCalculadora(viveiros: ViveiroDados[]): {
  atualizados: number;
  erros: number;
  detalhes: Array<{
    viveiroId: number;
    sucesso: boolean;
    resultado?: ResultadoRacaoSistema;
    erro?: string;
  }>;
} {
  const detalhes: any[] = [];
  let atualizados = 0;
  let erros = 0;
  
  viveiros.forEach(viveiro => {
    try {
      const resultado = AdaptadorCalculadoraRacao.calcularRacaoParaSistema(viveiro);
      detalhes.push({
        viveiroId: viveiro.id,
        sucesso: true,
        resultado
      });
      atualizados++;
    } catch (error) {
      detalhes.push({
        viveiroId: viveiro.id,
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      erros++;
    }
  });
  
  return {
    atualizados,
    erros,
    detalhes
  };
}

/**
 * Exemplo de uso no backend (Node.js)
 */
export function exemploBackend() {
  // Dados que viriam do banco de dados
  const viveiroExemplo: ViveiroDados = {
    id: 1,
    nome: 'VIVEIRO 01',
    densidade: 50,
    area: 1000,
    data_inicio_ciclo: '2024-02-01',
    peso_medio: 8.5,
    mortalidade_registrada: 2500
  };
  
  // Calcular ração
  const resultado = AdaptadorCalculadoraRacao.calcularRacaoParaSistema(viveiroExemplo);
  
  console.log('Resultado para API:', {
    recomendadoTotal: resultado.totalKg,
    recomendadoManha: resultado.manhaKg,
    recomendadoTarde: resultado.tardeKg,
    biomassa: resultado.biomassaEstimadaKg,
    fase: resultado.fase,
    taxaAlimentacao: resultado.taxaAlimentacao
  });
  
  return resultado;
}

/**
 * Exemplo de uso no frontend (React) - separar em arquivo .tsx
 */
export const exemploFrontendCode = `
// Hook personalizado para React
const useCalculadoraRacao = (viveiro: ViveiroDados) => {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const calcular = async () => {
      try {
        setLoading(true);
        const resultadoCalculo = AdaptadorCalculadoraRacao.calcularRacaoParaSistema(viveiro);
        setResultado(resultadoCalculo);
      } catch (err) {
        setError(err.message || 'Erro no cálculo');
      } finally {
        setLoading(false);
      }
    };
    
    calcular();
  }, [viveiro]);
  
  return { resultado, loading, error };
};

// Exemplo de componente React
const ComponenteRacao = ({ viveiro }) => {
  const { resultado, loading, error } = useCalculadoraRacao(viveiro);
  
  if (loading) return <div>Calculando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!resultado) return null;
  
  return (
    <div>
      <h3>{viveiro.nome}</h3>
      <p>Fase: {resultado.faseCultivo}</p>
      <p>Biomassa: {resultado.biomassaEstimadaKg} kg</p>
      <p>Ração Manhã: {resultado.manhaKg} kg</p>
      <p>Ração Tarde: {resultado.tardeKg} kg</p>
      <p>Total: {resultado.totalKg} kg/dia</p>
      {resultado.usandoNovaCalculadora && (
        <span style={{ color: 'green' }}>✅ Cálculo preciso</span>
      )}
    </div>
  );
};
`;

export default AdaptadorCalculadoraRacao;
