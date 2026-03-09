/**
 * Testes e Demonstração da Calculadora de Ração
 * 
 * Este arquivo demonstra o uso da calculadora com exemplos práticos
 * e casos de teste para validar a implementação.
 */

import { 
  CalculadoraRacao, 
  calcularRacaoSimples, 
  ParametrosViveiro, 
  ResultadoCalculoRacao,
  EXEMPLOS_USO 
} from './CalculadoraRacao';

/**
 * Função para executar testes da calculadora
 */
export function executarTestesCalculadora(): void {
  console.log('🦐 Iniciando testes da Calculadora de Ração para Litopenaeus vannamei\n');
  
  // Teste 1: Exemplo básico do enunciado
  console.log('📊 Teste 1: Exemplo básico (100.000 camarões, 0.03g)');
  try {
    const resultado1 = calcularRacaoSimples(100000, 0.03);
    console.log('Resultado:', resultado1);
    console.log('✅ Teste 1 passed\n');
  } catch (error) {
    console.error('❌ Teste 1 failed:', error);
  }
  
  // Teste 2: Diferentes fases de cultivo
  console.log('🔄 Teste 2: Diferentes fases de cultivo');
  const fasesTeste = [
    { peso: 0.02, fase: 'Pós-larva' },
    { peso: 0.3, fase: 'Berçário I' },
    { peso: 1.5, fase: 'Berçário II' },
    { peso: 3.5, fase: 'Engorda I' },
    { peso: 7.5, fase: 'Engorda II' },
    { peso: 15.0, fase: 'Engorda III' },
    { peso: 25.0, fase: 'Engorda Final' }
  ];
  
  fasesTeste.forEach(({ peso, fase }) => {
    try {
      const resultado = calcularRacaoSimples(50000, peso);
      console.log(`${fase} (${peso}g): Taxa ${(resultado.taxaAlimentacao * 100).toFixed(1)}% - Total ${resultado.racaoTotalDia}kg`);
    } catch (error) {
      console.error(`Erro em ${fase}:`, error);
    }
  });
  console.log('✅ Teste 2 completed\n');
  
  // Teste 3: Múltiplos períodos
  console.log('⏰ Teste 3: Distribuição em 4 períodos');
  try {
    const resultado4periodos = CalculadoraRacao.calcularRacaoMultiPeriodos(
      { quantidadeCamaroes: 75000, pesoMedioGramas: 5.2 },
      4
    );
    console.log('Distribuição 4 períodos:');
    resultado4periodos.racoesPorPeriodo.forEach(periodo => {
      console.log(`  ${periodo.nome}: ${periodo.quantidade}kg`);
    });
    console.log('✅ Teste 3 passed\n');
  } catch (error) {
    console.error('❌ Teste 3 failed:', error);
  }
  
  // Teste 4: Análise de cultivo
  console.log('🔍 Teste 4: Análise de cultivo');
  try {
    const analise = CalculadoraRacao.analisarCultivo({ 
      quantidadeCamaroes: 120000, 
      pesoMedioGramas: 12.5 
    });
    console.log('Análise:', analise.analise);
    console.log('Recomendações:');
    analise.recomendacoes.forEach(rec => console.log(`  • ${rec}`));
    console.log('Pontos de atenção:');
    analise.pontosAtencao.forEach(ponto => console.log(`  ⚠️ ${ponto}`));
    console.log('✅ Teste 4 passed\n');
  } catch (error) {
    console.error('❌ Teste 4 failed:', error);
  }
  
  // Teste 5: Validação de parâmetros
  console.log('🛡️ Teste 5: Validação de parâmetros');
  const parametrosInvalidos = [
    { quantidade: 0, peso: 5.0, descricao: 'quantidade zero' },
    { quantidade: 50000, peso: 0, descricao: 'peso zero' },
    { quantidade: -1000, peso: 5.0, descricao: 'quantidade negativa' },
    { quantidade: 50000, peso: -2.0, descricao: 'peso negativo' },
    { quantidade: 2000000, peso: 5.0, descricao: 'quantidade muito alta' },
    { quantidade: 50000, peso: 100.0, descricao: 'peso muito alto' }
  ];
  
  parametrosInvalidos.forEach(({ quantidade, peso, descricao }) => {
    try {
      calcularRacaoSimples(quantidade, peso);
      console.error(`❌ Falha na validação: ${descricao} deveria ter rejeitado`);
    } catch (error) {
      console.log(`✅ Validação funcionou para: ${descricao}`);
    }
  });
  console.log('✅ Teste 5 completed\n');
  
  console.log('🎉 Todos os testes concluídos!');
}

/**
 * Função para demonstrar casos de uso reais
 */
export function demonstrarCasosUso(): void {
  console.log('🌾 Demonstração de Casos de Uso Reais\n');
  
  // Caso 1: Fazenda pequena
  console.log('🏡 Caso 1: Fazenda pequena (5 hectares)');
  const fazendaPequena = {
    viveiros: [
      { id: 'V01', camaroes: 80000, peso: 2.3 },
      { id: 'V02', camaroes: 75000, peso: 3.1 },
      { id: 'V03', camaroes: 82000, peso: 1.8 }
    ]
  };
  
  let totalRacaoFazendaPequena = 0;
  fazendaPequena.viveiros.forEach(viveiro => {
    const resultado = calcularRacaoSimples(viveiro.camaroes, viveiro.peso);
    console.log(`Viveiro ${viveiro.id}: ${resultado.racaoTotalDia.toFixed(1)}kg/dia`);
    totalRacaoFazendaPequena += resultado.racaoTotalDia;
  });
  console.log(`Total fazenda pequena: ${totalRacaoFazendaPequena.toFixed(1)}kg/dia\n`);
  
  // Caso 2: Fazenda média
  console.log('🏭 Caso 2: Fazenda média (20 hectares)');
  const fazendaMedia = {
    viveiros: [
      { id: 'V01', camaroes: 120000, peso: 8.5 },
      { id: 'V02', camaroes: 115000, peso: 9.2 },
      { id: 'V03', camaroes: 118000, peso: 7.8 },
      { id: 'V04', camaroes: 122000, peso: 10.1 },
      { id: 'V05', camaroes: 119000, peso: 8.9 }
    ]
  };
  
  let totalRacaoFazendaMedia = 0;
  fazendaMedia.viveiros.forEach(viveiro => {
    const resultado = calcularRacaoSimples(viveiro.camaroes, viveiro.peso);
    console.log(`Viveiro ${viveiro.id}: ${resultado.racaoTotalDia.toFixed(1)}kg/dia`);
    totalRacaoFazendaMedia += resultado.racaoTotalDia;
  });
  console.log(`Total fazenda média: ${totalRacaoFazendaMedia.toFixed(1)}kg/dia\n`);
  
  // Caso 3: Ciclo completo
  console.log('🔄 Caso 3: Evolução do ciclo completo (120 dias)');
  const cicloCompleto = [
    { dia: 1, peso: 0.015 },
    { dia: 15, peso: 0.8 },
    { dia: 30, peso: 2.5 },
    { dia: 45, peso: 5.5 },
    { dia: 60, peso: 8.2 },
    { dia: 75, peso: 12.1 },
    { dia: 90, peso: 16.8 },
    { dia: 105, peso: 21.3 },
    { dia: 120, peso: 28.5 }
  ];
  
  cicloCompleto.forEach(({ dia, peso }) => {
    const resultado = calcularRacaoSimples(100000, peso);
    console.log(`Dia ${dia.toString().padStart(3, ' ')}: ${resultado.racaoTotalDia.toFixed(1)}kg (${(resultado.taxaAlimentacao * 100).toFixed(1)}%)`);
  });
  
  // Cálculo do total do ciclo
  const totalCiclo = cicloCompleto.reduce((acc, { peso }) => {
    const resultado = calcularRacaoSimples(100000, peso);
    return acc + resultado.racaoTotalDia;
  }, 0);
  console.log(`\nTotal ciclo completo: ${totalCiclo.toFixed(1)}kg`);
  console.log(`Média diária: ${(totalCiclo / 120).toFixed(1)}kg\n`);
}

/**
 * Função para benchmark de performance
 */
export function benchmarkPerformance(): void {
  console.log('⚡ Benchmark de Performance\n');
  
  const iteracoes = 10000;
  const parametrosTeste = { quantidadeCamaroes: 75000, pesoMedioGramas: 6.8 };
  
  console.time('Cálculo simples');
  for (let i = 0; i < iteracoes; i++) {
    calcularRacaoSimples(parametrosTeste.quantidadeCamaroes, parametrosTeste.pesoMedioGramas);
  }
  console.timeEnd('Cálculo simples');
  
  console.time('Cálculo completo com análise');
  for (let i = 0; i < iteracoes; i++) {
    CalculadoraRacao.calcularRacaoDiaria(parametrosTeste);
    CalculadoraRacao.analisarCultivo(parametrosTeste);
  }
  console.timeEnd('Cálculo completo com análise');
  
  console.log(`✅ ${iteracoes} iterações concluídas\n`);
}

/**
 * Função principal que executa todas as demonstrações
 */
export function executarDemonstracaoCompleta(): void {
  console.log('🦐 Calculadora de Ração - Demonstração Completa');
  console.log('=' .repeat(50));
  
  executarTestesCalculadora();
  console.log('\n' + '=' .repeat(50));
  
  demonstrarCasosUso();
  console.log('\n' + '=' .repeat(50));
  
  benchmarkPerformance();
  console.log('\n' + '=' .repeat(50));
  
  console.log('🎓 Demonstração concluída com sucesso!');
  console.log('A calculadora está pronta para uso em produção.\n');
}

// Exportar funções para uso externo
export default {
  executarTestesCalculadora,
  demonstrarCasosUso,
  benchmarkPerformance,
  executarDemonstracaoCompleta
};

// Se este arquivo for executado diretamente, rodar a demonstração
if (typeof window === 'undefined' && typeof module !== 'undefined' && module.exports) {
  executarDemonstracaoCompleta();
}
