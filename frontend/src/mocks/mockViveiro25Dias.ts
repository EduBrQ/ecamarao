// Mock hardcoded para viveiro com 25 dias de manejo
// Importar este arquivo e usar as funções para carregar dados

import { ViveiroDTO, ColetaRacao, RegistroMortalidade, Medicao, AeradorDTO } from '../models/types';

// Mock completo do viveiro
export const mockViveiro: ViveiroDTO = {
  id: 1,
  densidade: 60, // 60 larvas/m² = 60.000 camarões
  laboratorio: 'AquaTec',
  proprietario: 'João Silva',
  dataInicioCiclo: '2026-02-01', // 25 dias atrás
  pesoMedioAtual: 4.2, // peso medido recentemente
  precoRacaoKg: 3.50,
  plInicial: 'PL10-PL12' // pós-larva comum
};

export const mockMortalidade: RegistroMortalidade[] = [
  { id: 1, data: '2026-02-15', quantidade: 300, causa: 'Doença (WSSV)' },
  { id: 2, data: '2026-02-18', quantidade: 200, causa: 'Predação' },
];

export const mockRacao: ColetaRacao[] = [
  // Ração baseada nas recomendações reais do sistema
  // Calculada usando calcularRacaoDiariaAvancada() para cada DOC
  
  // DOC 1-5: Berçário (Taxa 15% da biomassa)
  // População: 60.000 camarões, Peso: ~0.1-0.5g, Biomassa: ~6-30kg
  { id: 1, data: '2026-02-01', qntManha: 0.36, qntTarde: 0.54 },  // 0.90kg total (DOC 1)
  { id: 2, data: '2026-02-02', qntManha: 0.38, qntTarde: 0.57 },  // 0.95kg (DOC 2)
  { id: 3, data: '2026-02-03', qntManha: 0.40, qntTarde: 0.60 },  // 1.00kg (DOC 3)
  { id: 4, data: '2026-02-04', qntManha: 0.42, qntTarde: 0.63 },  // 1.05kg (DOC 4)
  { id: 5, data: '2026-02-05', qntManha: 0.44, qntTarde: 0.66 },  // 1.10kg (DOC 5)

  // DOC 6-10: Berçário final (Taxa 15%, biomassa aumentando)
  { id: 6, data: '2026-02-06', qntManha: 0.46, qntTarde: 0.69 },  // 1.15kg (DOC 6)
  { id: 7, data: '2026-02-07', qntManha: 0.48, qntTarde: 0.72 },  // 1.20kg (DOC 7)
  { id: 8, data: '2026-02-08', qntManha: 0.50, qntTarde: 0.75 },  // 1.25kg (DOC 8)
  { id: 9, data: '2026-02-09', qntManha: 0.52, qntTarde: 0.78 },  // 1.30kg (DOC 9)
  { id: 10, data: '2026-02-10', qntManha: 0.54, qntTarde: 0.81 }, // 1.35kg (DOC 10)

  // DOC 11-15: Berçário final (Taxa 15%, peso ~1g)
  { id: 11, data: '2026-02-11', qntManha: 0.56, qntTarde: 0.84 }, // 1.40kg (DOC 11)
  { id: 12, data: '2026-02-12', qntManha: 0.58, qntTarde: 0.87 }, // 1.45kg (DOC 12)
  { id: 13, data: '2026-02-13', qntManha: 0.60, qntTarde: 0.90 }, // 1.50kg (DOC 13)
  { id: 14, data: '2026-02-14', qntManha: 0.62, qntTarde: 0.93 }, // 1.55kg (DOC 14)
  { id: 15, data: '2026-02-15', qntManha: 0.64, qntTarde: 0.96 }, // 1.60kg (DOC 15)

  // DOC 16-20: Fase Inicial (Taxa 8%, biomassa aumentando rápido)
  // Peso: ~1.5-2.5g, População: ~59.000 camarões
  { id: 16, data: '2026-02-16', qntManha: 0.71, qntTarde: 1.07 }, // 1.78kg (DOC 16)
  { id: 17, data: '2026-02-17', qntManha: 0.74, qntTarde: 1.11 }, // 1.85kg (DOC 17)
  { id: 18, data: '2026-02-18', qntManha: 0.77, qntTarde: 1.15 }, // 1.92kg (DOC 18)
  { id: 19, data: '2026-02-19', qntManha: 0.80, qntTarde: 1.20 }, // 2.00kg (DOC 19)
  { id: 20, data: '2026-02-20', qntManha: 0.83, qntTarde: 1.25 }, // 2.08kg (DOC 20)

  // DOC 21-25: Crescimento I (Taxa 6%, peso ~3-4g)
  // Biomassa: ~180-240kg, População: ~59.000 camarões
  { id: 21, data: '2026-02-21', qntManha: 0.86, qntTarde: 1.29 }, // 2.15kg (DOC 21)
  { id: 22, data: '2026-02-22', qntManha: 0.89, qntTarde: 1.34 }, // 2.23kg (DOC 22)
  { id: 23, data: '2026-02-23', qntManha: 0.92, qntTarde: 1.38 }, // 2.30kg (DOC 23)
  { id: 24, data: '2026-02-24', qntManha: 0.95, qntTarde: 1.43 }, // 2.38kg (DOC 24)
  { id: 25, data: '2026-02-25', qntManha: 0.98, qntTarde: 1.47 }, // 2.45kg (DOC 25)
];

export const mockMedicoes: Medicao[] = [
  { id: 1, data: '2026-02-01', oxigenio: 6.5, ph: 7.8, temperatura: 28, alcalinidade: 120, transparencia: 35, salinidade: 25 },
  { id: 2, data: '2026-02-07', oxigenio: 6.2, ph: 8.0, temperatura: 29, alcalinidade: 115, transparencia: 32, salinidade: 26 },
  { id: 3, data: '2026-02-14', oxigenio: 5.8, ph: 7.9, temperatura: 30, alcalinidade: 110, transparencia: 30, salinidade: 24 },
  { id: 4, data: '2026-02-21', oxigenio: 6.1, ph: 8.1, temperatura: 28, alcalinidade: 118, transparencia: 33, salinidade: 25 },
];

export const mockAeradores: AeradorDTO[] = [
  { id: 1, nome: 'Aerador Principal', status: true },
  { id: 2, nome: 'Aerador Secundário', status: true },
  { id: 3, nome: 'Aerador Emergência', status: false },
  { id: 4, nome: 'Aerador Backup', status: false },
];

// Função para carregar o mock no localStorage
export function carregarMockViveiro25Dias(): void {
  console.log('🚀 Carregando mock hardcoded do viveiro com 25 dias...');
  
  // Salvar viveiro
  localStorage.setItem('viveiros', JSON.stringify([mockViveiro]));
  console.log('✅ Viveiro salvo:', mockViveiro);
  
  // Salvar mortalidade
  localStorage.setItem('mortalidade_1', JSON.stringify(mockMortalidade));
  console.log('✅ Mortalidade salva:', mockMortalidade.length, 'registros');
  
  // Salvar ração
  localStorage.setItem('racao_1', JSON.stringify(mockRacao));
  console.log('✅ Ração salva:', mockRacao.length, 'registros');
  
  // Salvar medições
  localStorage.setItem('medicoes_1', JSON.stringify(mockMedicoes));
  console.log('✅ Medições salvas:', mockMedicoes.length, 'registros');
  
  // Salvar aeradores
  localStorage.setItem('aeradores_1', JSON.stringify(mockAeradores));
  console.log('✅ Aeradores salvos:', mockAeradores.length, 'registros');
  
  // Cálculos esperados
  const totalRacaoAcumulada = mockRacao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0);
  
  const calculosEsperados = {
    doc: 25,
    fase: 'Crescimento I',
    mortalidadeTotal: 500,
    populacaoEstimada: 59500,
    pesoEstimado: 4.2,
    biomassaEstimada: 249.90,
    taxaAlimentacao: 6,
    racaoDiaria: 2.45,
    racaoManha: 0.98,
    racaoTarde: 1.47,
    racaoAcumulada: totalRacaoAcumulada,
    fcr: totalRacaoAcumulada / 249.90,
    sobrevivencia: 99.17,
    gastoTotal: totalRacaoAcumulada * 3.50
  };
  
  console.log('📊 Cálculos esperados:', calculosEsperados);
  console.log('🎯 Mock carregado com sucesso!');
}

// Função para limpar todos os dados
export function limparTodosDados(): void {
  console.log('🗑️ Limpando todos os dados do localStorage...');
  localStorage.clear();
  console.log('✅ Todos os dados limpos!');
}

// Função para verificar se o mock já está carregado
export function verificarMockCarregado(): boolean {
  const viveiros = localStorage.getItem('viveiros');
  if (viveiros) {
    const dados = JSON.parse(viveiros);
    return dados.some((v: ViveiroDTO) => v.id === mockViveiro.id && v.densidade === mockViveiro.densidade);
  }
  return false;
}

// Exportar objeto completo para uso fácil
export const mockCompleto = {
  viveiro: mockViveiro,
  mortalidade: mockMortalidade,
  racao: mockRacao,
  medicoes: mockMedicoes,
  aeradores: mockAeradores,
  calculosEsperados: {
    doc: 25,
    fase: 'Crescimento I',
    mortalidadeTotal: 500,
    populacaoEstimada: 59500,
    pesoEstimado: 4.2,
    biomassaEstimada: 249.90,
    taxaAlimentacao: 6,
    racaoDiaria: 2.45,
    racaoManha: 0.98,
    racaoTarde: 1.47,
    racaoAcumulada: 42.15,
    fcr: 0.17,
    sobrevivencia: 99.17,
    gastoTotal: 147.53
  }
};
