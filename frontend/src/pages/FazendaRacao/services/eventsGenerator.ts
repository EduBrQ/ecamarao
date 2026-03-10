import { ViveiroDashboard } from '../types/dashboard';
import { detectarAnomalias } from './anomalyDetector';
import { normalizeDate } from '../utils/dateUtils';

export interface FarmEvent {
  id: string;
  tipo: 'alimentacao' | 'alerta' | 'completou';
  horario: string;
  mensagem: string;
  detalhes?: string;
  severidade?: 'baixa' | 'media' | 'alta';
}

/**
 * Gera eventos da fazenda baseados nos dados dos viveiros
 * @param viveiros - Lista de viveiros da fazenda
 * @returns Lista de eventos ordenados por horário
 */
export const gerarEventosFazenda = (viveiros: ViveiroDashboard[]): FarmEvent[] => {
  const eventos: FarmEvent[] = [];
  const hoje = new Date();
  
  // Eventos de alimentação de hoje
  viveiros.forEach(viveiro => {
    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje.toISOString().split('T')[0]);
    
    if (racaoHoje && racaoHoje.total > 0) {
      eventos.push({
        id: `alimentacao-${viveiro.viveiro.id}`,
        tipo: 'alimentacao',
        horario: '10:32',
        mensagem: `${viveiro.viveiro.nome} alimentado`,
        detalhes: `${racaoHoje.total.toFixed(1)}kg ração`
      });
    }
    
    // Detectar alertas
    const anomalias = detectarAnomalias(viveiro);
    anomalias.forEach(anomalia => {
      eventos.push({
        id: `alerta-${viveiro.viveiro.id}-${anomalia.tipo}`,
        tipo: 'alerta',
        horario: '09:20',
        mensagem: `Alerta no ${viveiro.viveiro.nome}`,
        detalhes: anomalia.mensagem,
        severidade: anomalia.severidade
      });
    });
  });
  
  // Ordenar por horário (mais recentes primeiro)
  return eventos.sort((a, b) => b.horario.localeCompare(a.horario));
};
