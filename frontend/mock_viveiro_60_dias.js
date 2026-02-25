// Mock de dados para viveiro com 60 dias de manejo
// Referência para testes e demonstração do sistema

const mockViveiro60Dias = {
  // Dados do viveiro
  viveiro: {
    id: 1,
    densidade: 60, // 60 larvas/m² = 60.000 camarões
    laboratorio: 'AquaTec',
    proprietario: 'João Silva',
    dataInicioCiclo: '2024-12-01', // 60 dias atrás (considerando data atual: 30/01/2025)
    pesoMedioAtual: 8.5, // peso medido recentemente
    precoRacaoKg: 3.50,
    plInicial: 'PL10-PL12' // pós-larva comum
  },

  // Registros de mortalidade (simulados)
  mortalidade: [
    { id: 1, data: '2024-12-15', quantidade: 500, causa: 'Doença (WSSV)' },
    { id: 2, data: '2024-12-28', quantidade: 300, causa: 'Predação' },
    { id: 3, data: '2025-01-10', quantidade: 200, causa: 'Estresse térmico' },
    { id: 4, data: '2025-01-20', quantidade: 150, causa: 'Baixa oxigenação' }
  ],

  // Registros de ração (últimos 30 dias)
  racao: [
    // Janeiro 2025
    { id: 1, data: '2025-01-01', qntManha: 2.5, qntTarde: 3.8 },
    { id: 2, data: '2025-01-02', qntManha: 2.6, qntTarde: 3.9 },
    { id: 3, data: '2025-01-03', qntManha: 2.7, qntTarde: 4.0 },
    { id: 4, data: '2025-01-04', qntManha: 2.8, qntTarde: 4.1 },
    { id: 5, data: '2025-01-05', qntManha: 2.9, qntTarde: 4.2 },
    { id: 6, data: '2025-01-06', qntManha: 3.0, qntTarde: 4.3 },
    { id: 7, data: '2025-01-07', qntManha: 3.1, qntTarde: 4.4 },
    { id: 8, data: '2025-01-08', qntManha: 3.2, qntTarde: 4.5 },
    { id: 9, data: '2025-01-09', qntManha: 3.3, qntTarde: 4.6 },
    { id: 10, data: '2025-01-10', qntManha: 3.4, qntTarde: 4.7 },
    { id: 11, data: '2025-01-11', qntManha: 3.5, qntTarde: 4.8 },
    { id: 12, data: '2025-01-12', qntManha: 3.6, qntTarde: 4.9 },
    { id: 13, data: '2025-01-13', qntManha: 3.7, qntTarde: 5.0 },
    { id: 14, data: '2025-01-14', qntManha: 3.8, qntTarde: 5.1 },
    { id: 15, data: '2025-01-15', qntManha: 3.9, qntTarde: 5.2 },
    { id: 16, data: '2025-01-16', qntManha: 4.0, qntTarde: 5.3 },
    { id: 17, data: '2025-01-17', qntManha: 4.1, qntTarde: 5.4 },
    { id: 18, data: '2025-01-18', qntManha: 4.2, qntTarde: 5.5 },
    { id: 19, data: '2025-01-19', qntManha: 4.3, qntTarde: 5.6 },
    { id: 20, data: '2025-01-20', qntManha: 4.4, qntTarde: 5.7 },
    { id: 21, data: '2025-01-21', qntManha: 4.5, qntTarde: 5.8 },
    { id: 22, data: '2025-01-22', qntManha: 4.6, qntTarde: 5.9 },
    { id: 23, data: '2025-01-23', qntManha: 4.7, qntTarde: 6.0 },
    { id: 24, data: '2025-01-24', qntManha: 4.8, qntTarde: 6.1 },
    { id: 25, data: '2025-01-25', qntManha: 4.9, qntTarde: 6.2 },
    { id: 26, data: '2025-01-26', qntManha: 5.0, qntTarde: 6.3 },
    { id: 27, data: '2025-01-27', qntManha: 5.1, qntTarde: 6.4 },
    { id: 28, data: '2025-01-28', qntManha: 5.2, qntTarde: 6.5 },
    { id: 29, data: '2025-01-29', qntManha: 5.3, qntTarde: 6.6 },
    { id: 30, data: '2025-01-30', qntManha: 5.4, qntTarde: 6.7 }
  ],

  // Registros de medições de qualidade da água
  medicoes: [
    { id: 1, data: '2025-01-01', oxigenio: 6.5, ph: 7.8, temperatura: 28, alcalinidade: 120, transparencia: 35, salinidade: 25 },
    { id: 2, data: '2025-01-07', oxigenio: 6.2, ph: 8.0, temperatura: 29, alcalinidade: 115, transparencia: 32, salinidade: 26 },
    { id: 3, data: '2025-01-14', oxigenio: 5.8, ph: 7.9, temperatura: 30, alcalinidade: 110, transparencia: 30, salinidade: 24 },
    { id: 4, data: '2025-01-21', oxigenio: 6.1, ph: 8.1, temperatura: 28, alcalinidade: 118, transparencia: 33, salinidade: 25 },
    { id: 5, data: '2025-01-28', oxigenio: 6.3, ph: 7.7, temperatura: 29, alcalinidade: 122, transparencia: 36, salinidade: 27 }
  ],

  // Registros de aeradores
  aeradores: [
    { id: 1, nome: 'Aerador - 1', status: true },
    { id: 2, nome: 'Aerador - 2', status: true },
    { id: 3, nome: 'Aerador - 3', status: false },
    { id: 4, nome: 'Aerador - 4', status: true }
  ]
};

// Cálculos esperados para este mock
const calculosEsperados = {
  doc: 60, // Dias de cultivo
  fase: 'Crescimento II',
  mortalidadeTotal: 1150, // 500 + 300 + 200 + 150
  populacaoEstimada: 58850, // 60.000 - 1.150
  pesoEstimado: 8.5, // baseado em PL10-PL12 + 60 dias de crescimento
  biomassaEstimada: 500.23, // 58.850 × 8.5g ÷ 1000
  taxaAlimentacao: 5, // 5% da biomassa/dia para fase Crescimento II
  racaoDiaria: 25.01, // 500.23 × 5% = 25.01kg
  racaoManha: 10.00, // 40% do total
  racaoTarde: 15.01, // 60% do total
  racaoAcumulada: 218.4, // soma de todos os registros de ração
  fcr: 0.44, // 218.4 ÷ 500.23
  sobrevivencia: 98.08, // (58.850 ÷ 60.000) × 100
  gastoTotal: 764.40, // 218.4 × R$3.50
};

// Logs detalhados para referência
const logsDetalhados = {
  calculoPeso: `
    Cálculo de peso para DOC 60 com PL10-PL12:
    - Peso inicial PL: 0.003g (3mg)
    - Dias de crescimento: 60 - 11 = 49 dias
    - Taxa de crescimento fase Crescimento II: 0.35g/dia
    - Peso estimado: 8.5g (com fator de redução)
    Fonte: preverPesoAtualComPL()
  `,
  
  calculoPopulacao: `
    Estimativa de população:
    - População inicial: 60.000 camarões
    - Mortalidade registrada: 1.150 camarões
    - Mortalidade esperada DOC 60: 18% = 10.800 camarões
    - População estimada: 60.000 - 10.800 = 49.200 camarões
    - Usando valor maior: 58.850 (mortalidade real menor que esperada)
    Fonte: estimarPopulacaoAtual()
  `,
  
  calculoBiomassa: `
    Cálculo de biomassa:
    - População: 58.850 camarões
    - Peso médio: 8.5g
    - Biomassa: (58.850 × 8.5) ÷ 1000 = 500.23kg
    Fonte: cálculo direto
  `,
  
  calculoRacao: `
    Recomendação de ração:
    - Biomassa: 500.23kg
    - Taxa alimentação: 5% (fase Crescimento II)
    - Total dia: 500.23 × 5% = 25.01kg
    - Manhã: 25.01 × 40% = 10.00kg
    - Tarde: 25.01 × 60% = 15.01kg
    Fonte: calcularRacaoDiariaAvancada()
  `,
  
  metricasDesempenho: `
    Indicadores de desempenho:
    - FCR: 218.4 ÷ 500.23 = 0.44 (Excelente)
    - Sobrevivência: (58.850 ÷ 60.000) × 100 = 98.08% (Excelente)
    - Gasto total: 218.4kg × R$3.50 = R$764.40
    - Custo por kg: R$764.40 ÷ 500.23kg = R$1.53/kg
  `
};

// Função para carregar este mock no localStorage
function carregarMockViveiro60Dias() {
  // Salvar viveiro
  localStorage.setItem('viveiros', JSON.stringify([mockViveiro60Dias.viveiro]));
  
  // Salvar mortalidade
  localStorage.setItem('mortalidade_1', JSON.stringify(mockViveiro60Dias.mortalidade));
  
  // Salvar ração
  localStorage.setItem('racao_1', JSON.stringify(mockViveiro60Dias.racao));
  
  // Salvar medições
  localStorage.setItem('medicoes_1', JSON.stringify(mockViveiro60Dias.medicoes));
  
  // Salvar aeradores
  localStorage.setItem('aeradores_1', JSON.stringify(mockViveiro60Dias.aeradores));
  
  console.log('Mock do viveiro com 60 dias carregado com sucesso!');
  console.log('Dados do viveiro:', mockViveiro60Dias.viveiro);
  console.log('Cálculos esperados:', calculosEsperados);
  console.log('Logs detalhados:', logsDetalhados);
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mockViveiro60Dias, calculosEsperados, logsDetalhados, carregarMockViveiro60Dias };
}

// Auto-executar se estiver no browser
if (typeof window !== 'undefined') {
  window.carregarMockViveiro60Dias = carregarMockViveiro60Dias;
  window.mockViveiro60Dias = mockViveiro60Dias;
  window.calculosEsperados = calculosEsperados;
  window.logsDetalhados = logsDetalhados;
}
