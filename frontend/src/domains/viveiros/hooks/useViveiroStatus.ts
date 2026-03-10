import { useMemo } from 'react';
import { ViveiroDashboard, FeedingStatus } from '../types';
import { normalizeDate } from '../../../utils/date';

interface UseViveiroStatusReturn {
  statusAlimentacao: FeedingStatus;
  alimentouManha: boolean;
  alimentouTarde: boolean;
  percentualRecomendado: number;
  precisaAtencao: boolean;
}

/**
 * Hook customizado para calcular status de alimentação do viveiro
 * @param viveiro - Dados do viveiro
 * @returns Status calculados do viveiro
 */
export const useViveiroStatus = (viveiro: ViveiroDashboard): UseViveiroStatusReturn => {
  const status = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const racaoHoje = viveiro.racoes.find(r => normalizeDate(r.data) === hoje);
    
    const alimentouManha = racaoHoje ? racaoHoje.qntManha > 0 : false;
    const alimentouTarde = racaoHoje ? racaoHoje.qntTarde > 0 : false;
    
    const statusAlimentacao: FeedingStatus = 
      alimentouManha && alimentouTarde ? 'complete' : 
      alimentouManha || alimentouTarde ? 'partial' : 'pending';
    
    const percentualRecomendado = viveiro.recomendadoTotal > 0 ? 
      ((racaoHoje?.total || 0) / viveiro.recomendadoTotal) * 100 : 0;
    
    const precisaAtencao = !alimentouManha && !alimentouTarde;
    
    return {
      statusAlimentacao,
      alimentouManha,
      alimentouTarde,
      percentualRecomendado,
      precisaAtencao
    };
  }, [viveiro]);

  return status;
};
