/**
 * Teste rápido para verificar a correção da CalculadoraRacao
 */

import { calcularRacaoSimples } from './CalculadoraRacao';

// Testar diferentes pesos para cobrir todas as faixas
const testes = [
  { peso: 0.02, descricao: 'Pós-larva' },
  { peso: 0.3, descricao: 'Berçário I' },
  { peso: 1.5, descricao: 'Berçário II' },
  { peso: 3.5, descricao: 'Engorda I' },
  { peso: 7.5, descricao: 'Engorda II' },
  { peso: 15.0, descricao: 'Engorda III' },
  { peso: 25.0, descricao: 'Engorda Final' }
];

console.log('🧪 Testando CalculadoraRacao após correção...');

testes.forEach(({ peso, descricao }) => {
  try {
    const resultado = calcularRacaoSimples(100000, peso);
    console.log(`✅ ${descricao} (${peso}g): Taxa ${(resultado.taxaAlimentacao * 100).toFixed(1)}% - Total ${resultado.racaoTotalDia}kg`);
  } catch (error) {
    console.error(`❌ Erro em ${descricao} (${peso}g):`, error instanceof Error ? error.message : 'Erro desconhecido');
  }
});

console.log('\n🎉 Testes concluídos!');
