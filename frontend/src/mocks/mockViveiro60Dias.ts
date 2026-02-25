// Mock hardcoded para viveiro com 60 dias de manejo
// Importar este arquivo e usar as funções para carregar dados

import { ViveiroDTO, ColetaRacao, RegistroMortalidade, Medicao, AeradorDTO } from '../models/types';

// Mock completo do viveiro
export const mockViveiro: ViveiroDTO = {
  id: 1,
  densidade: 60, // 60 larvas/m² = 60.000 camarões
  laboratorio: 'AquaTec',
  proprietario: 'João Silva',
  dataInicioCiclo: '2024-12-01', // 60 dias atrás
  pesoMedioAtual: 8.5, // peso medido recentemente
  precoRacaoKg: 3.50,
  plInicial: 'PL10-PL12' // pós-larva comum
};

export const mockMortalidade: RegistroMortalidade[] = [
  { id: 1, data: '2024-12-15', quantidade: 500, causa: 'Doença (WSSV)' },
  { id: 2, data: '2024-12-28', quantidade: 300, causa: 'Predação' },
  { id: 3, data: '2025-01-10', quantidade: 200, causa: 'Estresse térmico' },
  { id: 4, data: '2025-01-20', quantidade: 150, causa: 'Baixa oxigenação' }
];

export const mockRacao: ColetaRacao[] = [
  // Realidade: ração começa muito baixa e aumenta progressivamente
  // Baseado em biomassa real das PL em crescimento
  
  // Primeira quinzena: berçário (PL10-PL12 para ~1g)
  // Taxa inicial: 15% da biomassa (~0.5kg/ha/dia)
  { id: 1, data: '2024-12-01', qntManha: 0.25, qntTarde: 0.25 },  // 0.50kg total
  { id: 2, data: '2024-12-02', qntManha: 0.28, qntTarde: 0.28 },  // 0.56kg
  { id: 3, data: '2024-12-03', qntManha: 0.31, qntTarde: 0.31 },  // 0.62kg
  { id: 4, data: '2024-12-04', qntManha: 0.34, qntTarde: 0.34 },  // 0.68kg
  { id: 5, data: '2024-12-05', qntManha: 0.37, qntTarde: 0.37 },  // 0.74kg
  { id: 6, data: '2024-12-06', qntManha: 0.40, qntTarde: 0.40 },  // 0.80kg
  { id: 7, data: '2024-12-07', qntManha: 0.43, qntTarde: 0.43 },  // 0.86kg
  { id: 8, data: '2024-12-08', qntManha: 0.46, qntTarde: 0.46 },  // 0.92kg
  { id: 9, data: '2024-12-09', qntManha: 0.49, qntTarde: 0.49 },  // 0.98kg
  { id: 10, data: '2024-12-10', qntManha: 0.52, qntTarde: 0.52 },  // 1.04kg
  { id: 11, data: '2024-12-11', qntManha: 0.55, qntTarde: 0.55 },  // 1.10kg
  { id: 12, data: '2024-12-12', qntManha: 0.58, qntTarde: 0.58 },  // 1.16kg
  { id: 13, data: '2024-12-13', qntManha: 0.61, qntTarde: 0.61 },  // 1.22kg
  { id: 14, data: '2024-12-14', qntManha: 0.64, qntTarde: 0.64 },  // 1.28kg
  { id: 15, data: '2024-12-15', qntManha: 0.67, qntTarde: 0.67 },  // 1.34kg

  // Segunda quinzena: crescimento acelerado (~1g para ~3g)
  // Taxa de alimentação: 10-12% da biomassa
  { id: 16, data: '2024-12-16', qntManha: 1.00, qntTarde: 1.50 }, // 2.50kg
  { id: 17, data: '2024-12-17', qntManha: 1.10, qntTarde: 1.65 }, // 2.75kg
  { id: 18, data: '2024-12-18', qntManha: 1.20, qntTarde: 1.80 }, // 3.00kg
  { id: 19, data: '2024-12-19', qntManha: 1.30, qntTarde: 1.95 }, // 3.25kg
  { id: 20, data: '2024-12-20', qntManha: 1.40, qntTarde: 2.10 }, // 3.50kg
  { id: 21, data: '2024-12-21', qntManha: 1.50, qntTarde: 2.25 }, // 3.75kg
  { id: 22, data: '2024-12-22', qntManha: 1.60, qntTarde: 2.40 }, // 4.00kg
  { id: 23, data: '2024-12-23', qntManha: 1.70, qntTarde: 2.55 }, // 4.25kg
  { id: 24, data: '2024-12-24', qntManha: 1.80, qntTarde: 2.70 }, // 4.50kg
  { id: 25, data: '2024-12-25', qntManha: 1.90, qntTarde: 2.85 }, // 4.75kg
  { id: 26, data: '2024-12-26', qntManha: 2.00, qntTarde: 3.00 }, // 5.00kg
  { id: 27, data: '2024-12-27', qntManha: 2.10, qntTarde: 3.15 }, // 5.25kg
  { id: 28, data: '2024-12-28', qntManha: 2.20, qntTarde: 3.30 }, // 5.50kg
  { id: 29, data: '2024-12-29', qntManha: 2.30, qntTarde: 3.45 }, // 5.75kg
  { id: 30, data: '2024-12-30', qntManha: 2.40, qntTarde: 3.60 }, // 6.00kg

  // Terceira quinzena: crescimento intenso (~3g para ~5g)
  // Taxa de alimentação: 8-10% da biomassa
  { id: 31, data: '2024-12-31', qntManha: 2.50, qntTarde: 3.75 }, // 6.25kg
  { id: 32, data: '2025-01-01', qntManha: 2.80, qntTarde: 4.20 }, // 7.00kg
  { id: 33, data: '2025-01-02', qntManha: 3.10, qntTarde: 4.65 }, // 7.75kg
  { id: 34, data: '2025-01-03', qntManha: 3.40, qntTarde: 5.10 }, // 8.50kg
  { id: 35, data: '2025-01-04', qntManha: 3.70, qntTarde: 5.55 }, // 9.25kg
  { id: 36, data: '2025-01-05', qntManha: 4.00, qntTarde: 6.00 }, // 10.00kg
  { id: 37, data: '2025-01-06', qntManha: 4.30, qntTarde: 6.45 }, // 10.75kg
  { id: 38, data: '2025-01-07', qntManha: 4.60, qntTarde: 6.90 }, // 11.50kg
  { id: 39, data: '2025-01-08', qntManha: 4.90, qntTarde: 7.35 }, // 12.25kg
  { id: 40, data: '2025-01-09', qntManha: 5.20, qntTarde: 7.80 }, // 13.00kg
  { id: 41, data: '2025-01-10', qntManha: 5.50, qntTarde: 8.25 }, // 13.75kg
  { id: 42, data: '2025-01-11', qntManha: 5.80, qntTarde: 8.70 }, // 14.50kg
  { id: 43, data: '2025-01-12', qntManha: 6.10, qntTarde: 9.15 }, // 15.25kg
  { id: 44, data: '2025-01-13', qntManha: 6.40, qntTarde: 9.60 }, // 16.00kg
  { id: 45, data: '2025-01-14', qntManha: 6.70, qntTarde: 10.05 }, // 16.75kg

  // Quarta quinzena: estabilização (~5g para ~7g)
  // Taxa de alimentação: 6-8% da biomassa
  { id: 46, data: '2025-01-15', qntManha: 3.20, qntTarde: 4.80 }, // 8.00kg
  { id: 47, data: '2025-01-16', qntManha: 3.40, qntTarde: 5.10 }, // 8.50kg
  { id: 48, data: '2025-01-17', qntManha: 3.60, qntTarde: 5.40 }, // 9.00kg
  { id: 49, data: '2025-01-18', qntManha: 3.80, qntTarde: 5.70 }, // 9.50kg
  { id: 50, data: '2025-01-19', qntManha: 4.00, qntTarde: 6.00 }, // 10.00kg
  { id: 51, data: '2025-01-20', qntManha: 4.20, qntTarde: 6.30 }, // 10.50kg
  { id: 52, data: '2025-01-21', qntManha: 4.40, qntTarde: 6.60 }, // 11.00kg
  { id: 53, data: '2025-01-22', qntManha: 4.60, qntTarde: 6.90 }, // 11.50kg
  { id: 54, data: '2025-01-23', qntManha: 4.80, qntTarde: 7.20 }, // 12.00kg
  { id: 55, data: '2025-01-24', qntManha: 5.00, qntTarde: 7.50 }, // 12.50kg
  { id: 56, data: '2025-01-25', qntManha: 5.20, qntTarde: 7.80 }, // 13.00kg
  { id: 57, data: '2025-01-26', qntManha: 5.40, qntTarde: 8.10 }, // 13.50kg
  { id: 58, data: '2025-01-27', qntManha: 5.60, qntTarde: 8.40 }, // 14.00kg
  { id: 59, data: '2025-01-28', qntManha: 5.80, qntTarde: 8.70 }, // 14.50kg
  { id: 60, data: '2025-01-29', qntManha: 6.00, qntTarde: 9.00 }, // 15.00kg

  // Últimos dias: crescimento estabilizado (~7g para ~8.5g)
  // Taxa de alimentação: 5-6% da biomassa
  { id: 61, data: '2025-01-30', qntManha: 4.90, qntTarde: 7.35 }, // 12.25kg
  { id: 62, data: '2025-02-01', qntManha: 5.00, qntTarde: 7.50 }, // 12.50kg
  { id: 63, data: '2025-02-02', qntManha: 5.10, qntTarde: 7.65 }, // 12.75kg
  { id: 64, data: '2025-02-03', qntManha: 5.20, qntTarde: 7.80 }, // 13.00kg
  { id: 65, data: '2025-02-04', qntManha: 5.30, qntTarde: 7.95 }, // 13.25kg
  { id: 66, data: '2025-02-05', qntManha: 5.40, qntTarde: 8.10 }, // 13.50kg
  { id: 67, data: '2025-02-06', qntManha: 5.50, qntTarde: 8.25 }, // 13.75kg
  { id: 68, data: '2025-02-07', qntManha: 5.60, qntTarde: 8.40 }, // 14.00kg
  { id: 69, data: '2025-02-08', qntManha: 5.70, qntTarde: 8.55 }, // 14.25kg
  { id: 70, data: '2025-02-09', qntManha: 5.80, qntTarde: 8.70 }, // 14.50kg
  { id: 71, data: '2025-02-10', qntManha: 5.90, qntTarde: 8.85 }, // 14.75kg
  { id: 72, data: '2025-02-11', qntManha: 6.00, qntTarde: 9.00 }, // 15.00kg
  { id: 73, data: '2025-02-12', qntManha: 6.10, qntTarde: 9.15 }, // 15.25kg
  { id: 74, data: '2025-02-13', qntManha: 6.20, qntTarde: 9.30 }, // 15.50kg
  { id: 75, data: '2025-02-14', qntManha: 6.30, qntTarde: 9.45 }, // 15.75kg
  { id: 76, data: '2025-02-15', qntManha: 6.40, qntTarde: 9.60 }, // 16.00kg
  { id: 77, data: '2025-02-16', qntManha: 6.50, qntTarde: 9.75 }, // 16.25kg
  { id: 78, data: '2025-02-17', qntManha: 6.60, qntTarde: 9.90 }, // 16.50kg
  { id: 79, data: '2025-02-18', qntManha: 6.70, qntTarde: 10.05 }, // 16.75kg
  { id: 80, data: '2025-02-19', qntManha: 6.80, qntTarde: 10.20 }, // 17.00kg
  { id: 81, data: '2025-02-20', qntManha: 6.90, qntTarde: 10.35 }, // 17.25kg
  { id: 82, data: '2025-02-21', qntManha: 7.00, qntTarde: 10.50 }, // 17.50kg
  { id: 83, data: '2025-02-22', qntManha: 7.10, qntTarde: 10.65 }, // 17.75kg
  { id: 84, data: '2025-02-23', qntManha: 7.20, qntTarde: 10.80 }, // 18.00kg
  { id: 85, data: '2025-02-24', qntManha: 7.30, qntTarde: 10.95 }, // 18.25kg
  { id: 86, data: '2025-02-25', qntManha: 7.40, qntTarde: 11.10 }, // 18.50kg
  { id: 87, data: '2025-02-26', qntManha: 7.50, qntTarde: 11.25 }, // 18.75kg
  { id: 88, data: '2025-02-27', qntManha: 7.60, qntTarde: 11.40 }, // 19.00kg
  { id: 89, data: '2025-02-28', qntManha: 7.70, qntTarde: 11.55 }, // 19.25kg
  { id: 90, data: '2025-02-29', qntManha: 7.80, qntTarde: 11.70 }, // 19.50kg
  { id: 91, data: '2025-03-01', qntManha: 8.00, qntTarde: 12.00 }, // 20.00kg
  { id: 92, data: '2025-03-02', qntManha: 8.10, qntTarde: 12.15 }, // 20.25kg
  { id: 93, data: '2025-03-03', qntManha: 8.20, qntTarde: 12.30 }, // 20.50kg
  { id: 94, data: '2025-03-04', qntManha: 8.30, qntTarde: 12.45 }, // 20.75kg
  { id: 95, data: '2025-03-05', qntManha: 8.40, qntTarde: 12.60 }, // 21.00kg
  { id: 96, data: '2025-03-06', qntManha: 8.50, qntTarde: 12.75 }, // 21.25kg
  { id: 97, data: '2025-03-07', qntManha: 8.60, qntTarde: 12.90 }, // 21.50kg
  { id: 98, data: '2025-03-08', qntManha: 8.70, qntTarde: 13.05 }, // 21.75kg
  { id: 99, data: '2025-03-09', qntManha: 8.80, qntTarde: 13.20 }, // 22.00kg
  { id: 100, data: '2025-03-10', qntManha: 8.90, qntTarde: 13.35 }, // 22.25kg
  { id: 101, data: '2025-03-11', qntManha: 9.00, qntTarde: 13.50 }, // 22.50kg
  { id: 102, data: '2025-03-12', qntManha: 9.10, qntTarde: 13.65 }, // 22.75kg
  { id: 103, data: '2025-03-13', qntManha: 9.20, qntTarde: 13.80 }, // 23.00kg
  { id: 104, data: '2025-03-14', qntManha: 9.30, qntTarde: 13.95 }, // 23.25kg
  { id: 105, data: '2025-03-15', qntManha: 9.40, qntTarde: 14.10 }, // 23.50kg
  { id: 106, data: '2025-03-16', qntManha: 9.50, qntTarde: 14.25 }, // 23.75kg
  { id: 107, data: '2025-03-17', qntManha: 9.60, qntTarde: 14.40 }, // 24.00kg
  { id: 108, data: '2025-03-18', qntManha: 9.70, qntTarde: 14.55 }, // 24.25kg
  { id: 109, data: '2025-03-19', qntManha: 9.80, qntTarde: 14.70 }, // 24.50kg
  { id: 110, data: '2025-03-20', qntManha: 9.90, qntTarde: 14.85 }, // 24.75kg
  { id: 111, data: '2025-03-21', qntManha: 10.00, qntTarde: 15.00 }, // 25.00kg
  { id: 112, data: '2025-03-22', qntManha: 10.10, qntTarde: 15.15 }, // 25.25kg
  { id: 113, data: '2025-03-23', qntManha: 10.20, qntTarde: 15.30 }, // 25.50kg
  { id: 114, data: '2025-03-24', qntManha: 10.30, qntTarde: 15.45 }, // 25.75kg
  { id: 115, data: '2025-03-25', qntManha: 10.40, qntTarde: 15.60 }, // 26.00kg
  { id: 116, data: '2025-03-26', qntManha: 10.50, qntTarde: 15.75 }, // 26.25kg
  { id: 117, data: '2025-03-27', qntManha: 10.60, qntTarde: 15.90 }, // 26.50kg
  { id: 118, data: '2025-03-28', qntManha: 10.70, qntTarde: 16.05 }, // 26.75kg
  { id: 119, data: '2025-03-29', qntManha: 10.80, qntTarde: 16.20 }, // 27.00kg
  { id: 120, data: '2025-03-30', qntManha: 10.90, qntTarde: 16.35 }, // 27.25kg
  { id: 121, data: '2025-03-31', qntManha: 11.00, qntTarde: 16.50 }, // 27.50kg
  { id: 122, data: '2025-04-01', qntManha: 11.10, qntTarde: 16.65 }, // 27.75kg
  { id: 123, data: '2025-04-02', qntManha: 11.20, qntTarde: 16.80 }, // 28.00kg
  { id: 124, data: '2025-04-03', qntManha: 11.30, qntTarde: 16.95 }, // 28.25kg
  { id: 125, data: '2025-04-04', qntManha: 11.40, qntTarde: 17.10 }, // 28.50kg
  { id: 126, data: '2025-04-05', qntManha: 11.50, qntTarde: 17.25 }, // 28.75kg
  { id: 127, data: '2025-04-06', qntManha: 11.60, qntTarde: 17.40 }, // 29.00kg
  { id: 128, data: '2025-04-07', qntManha: 11.70, qntTarde: 17.55 }, // 29.25kg
  { id: 129, data: '2025-04-08', qntManha: 11.80, qntTarde: 17.70 }, // 29.50kg
  { id: 130, data: '2025-04-09', qntManha: 11.90, qntTarde: 17.85 }, // 29.75kg
  { id: 131, data: '2025-04-10', qntManha: 12.00, qntTarde: 18.00 }, // 30.00kg
  { id: 132, data: '2025-04-11', qntManha: 12.10, qntTarde: 18.15 }, // 30.25kg
  { id: 133, data: '2025-04-12', qntManha: 12.20, qntTarde: 18.30 }, // 30.50kg
  { id: 134, data: '2025-04-13', qntManha: 12.30, qntTarde: 18.45 }, // 30.75kg
  { id: 135, data: '2025-04-14', qntManha: 12.40, qntTarde: 18.60 }, // 31.00kg
  { id: 136, data: '2025-04-15', qntManha: 12.50, qntTarde: 18.75 }, // 31.25kg
  { id: 137, data: '2025-04-16', qntManha: 12.60, qntTarde: 18.90 }, // 31.50kg
  { id: 138, data: '2025-04-17', qntManha: 12.70, qntTarde: 19.05 }, // 31.75kg
  { id: 139, data: '2025-04-18', qntManha: 12.80, qntTarde: 19.20 }, // 32.00kg
  { id: 140, data: '2025-04-19', qntManha: 12.90, qntTarde: 19.35 }, // 32.25kg
  { id: 141, data: '2025-04-20', qntManha: 13.00, qntTarde: 19.50 }, // 32.50kg
  { id: 142, data: '2025-04-21', qntManha: 13.10, qntTarde: 19.65 }, // 32.75kg
  { id: 143, data: '2025-04-22', qntManha: 13.20, qntTarde: 19.80 }, // 33.00kg
  { id: 144, data: '2025-04-23', qntManha: 13.30, qntTarde: 19.95 }, // 33.25kg
  { id: 145, data: '2025-04-24', qntManha: 13.40, qntTarde: 20.10 }, // 33.50kg
  { id: 146, data: '2025-04-25', qntManha: 13.50, qntTarde: 20.25 }, // 33.75kg
  { id: 147, data: '2025-04-26', qntManha: 13.60, qntTarde: 20.40 }, // 34.00kg
  { id: 148, data: '2025-04-27', qntManha: 13.70, qntTarde: 20.55 }, // 34.25kg
  { id: 149, data: '2025-04-28', qntManha: 13.80, qntTarde: 20.70 }, // 34.50kg
  { id: 150, data: '2025-04-29', qntManha: 13.90, qntTarde: 20.85 }, // 34.75kg
  { id: 151, data: '2025-04-30', qntManha: 14.00, qntTarde: 21.00 }, // 35.00kg
  { id: 119, data: '2025-03-28', qntManha: 10.70, qntTarde: 16.05 }, // 26.75kg
  { id: 120, data: '2025-03-29', qntManha: 10.80, qntTarde: 16.20 }, // 27.00kg
  { id: 121, data: '2025-03-30', qntManha: 10.90, qntTarde: 16.35 }, // 27.25kg
  { id: 122, data: '2025-04-01', qntManha: 11.00, qntTarde: 16.50 }, // 27.50kg
  { id: 123, data: '2025-04-02', qntManha: 11.10, qntTarde: 16.65 }, // 27.75kg
  { id: 124, data: '2025-04-03', qntManha: 11.20, qntTarde: 16.80 }, // 28.00kg
  { id: 125, data: '2025-04-04', qntManha: 11.30, qntTarde: 16.95 }, // 28.25kg
  { id: 126, data: '2025-04-05', qntManha: 11.40, qntTarde: 17.10 }, // 28.50kg
  { id: 127, data: '2025-04-06', qntManha: 11.50, qntTarde: 17.25 }, // 28.75kg
  { id: 128, data: '2025-04-07', qntManha: 11.60, qntTarde: 17.40 }, // 29.00kg
  { id: 129, data: '2025-04-08', qntManha: 11.70, qntTarde: 17.55 }, // 29.25kg
  { id: 130, data: '2025-04-09', qntManha: 11.80, qntTarde: 17.70 }, // 29.50kg
  { id: 131, data: '2025-04-10', qntManha: 11.90, qntTarde: 17.85 }, // 29.75kg
  { id: 132, data: '2025-04-11', qntManha: 12.00, qntTarde: 18.00 }, // 30.00kg
  { id: 133, data: '2025-04-12', qntManha: 12.10, qntTarde: 18.15 }, // 30.25kg
  { id: 134, data: '2025-04-13', qntManha: 12.20, qntTarde: 18.30 }, // 30.50kg
  { id: 135, data: '2025-04-14', qntManha: 12.30, qntTarde: 18.45 }, // 30.75kg
  { id: 136, data: '2025-04-15', qntManha: 12.40, qntTarde: 18.60 }, // 31.00kg
  { id: 137, data: '2025-04-16', qntManha: 12.50, qntTarde: 18.75 }, // 31.25kg
  { id: 138, data: '2025-04-17', qntManha: 12.60, qntTarde: 18.90 }, // 31.50kg
  { id: 139, data: '2025-04-18', qntManha: 12.70, qntTarde: 19.05 }, // 31.75kg
  { id: 140, data: '2025-04-19', qntManha: 12.80, qntTarde: 19.20 }, // 32.00kg
  { id: 141, data: '2025-04-20', qntManha: 12.90, qntTarde: 19.35 }, // 32.25kg
  { id: 142, data: '2025-04-21', qntManha: 13.00, qntTarde: 19.50 }, // 32.50kg
  { id: 143, data: '2025-04-22', qntManha: 13.10, qntTarde: 19.65 }, // 32.75kg
];

export const mockMedicoes: Medicao[] = [
  { id: 1, data: '2025-01-01', oxigenio: 6.5, ph: 7.8, temperatura: 28, alcalinidade: 120, transparencia: 35, salinidade: 25 },
  { id: 2, data: '2025-01-07', oxigenio: 6.2, ph: 8.0, temperatura: 29, alcalinidade: 115, transparencia: 32, salinidade: 26 },
  { id: 3, data: '2025-01-14', oxigenio: 5.8, ph: 7.9, temperatura: 30, alcalinidade: 110, transparencia: 30, salinidade: 24 },
  { id: 4, data: '2025-01-21', oxigenio: 6.1, ph: 8.1, temperatura: 28, alcalinidade: 118, transparencia: 33, salinidade: 25 },
  { id: 5, data: '2025-01-28', oxigenio: 6.3, ph: 7.7, temperatura: 29, alcalinidade: 122, transparencia: 36, salinidade: 27 }
];

export const mockAeradores: AeradorDTO[] = [
  { id: 1, nome: 'Aerador - 1', status: true },
  { id: 2, nome: 'Aerador - 2', status: true },
  { id: 3, nome: 'Aerador - 3', status: false },
  { id: 4, nome: 'Aerador - 4', status: true }
];

// Função para carregar o mock no localStorage
export function carregarMockViveiro60Dias(): void {
  console.log('🚀 Carregando mock hardcoded do viveiro com 60 dias...');
  
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
    doc: 60,
    fase: 'Crescimento II',
    mortalidadeTotal: 1150,
    populacaoEstimada: 58850,
    pesoEstimado: 8.5,
    biomassaEstimada: 500.23,
    taxaAlimentacao: 5,
    racaoDiaria: 25.01,
    racaoManha: 10.00,
    racaoTarde: 15.01,
    racaoAcumulada: totalRacaoAcumulada,
    fcr: totalRacaoAcumulada / 500.23,
    sobrevivencia: 98.08,
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
    doc: 60,
    fase: 'Crescimento II',
    mortalidadeTotal: 1150,
    populacaoEstimada: 58850,
    pesoEstimado: 8.5,
    biomassaEstimada: 500.23,
    taxaAlimentacao: 5,
    racaoDiaria: 25.01,
    racaoManha: 10.00,
    racaoTarde: 15.01,
    racaoAcumulada: 3320.05,
    fcr: 6.64,
    sobrevivencia: 98.08,
    gastoTotal: 11620.18
  }
};
