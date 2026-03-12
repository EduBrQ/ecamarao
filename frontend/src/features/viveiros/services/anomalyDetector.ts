import { ViveiroDashboard, Anomaly } from '../types';

/**
 * Detecta anomalias nos padrões de alimentação e crescimento
 */
export const detectarAnomalias = (viveiro: ViveiroDashboard): Anomaly[] => {
  const anomalias: Anomaly[] = [];
  
  // Detectar queda de consumo
  const diasUltimos7 = viveiro.racoes.slice(-7);
  if (diasUltimos7.length >= 3) {
    const mediaRecente = diasUltimos7.slice(-3).reduce((sum, r) => sum + r.total, 0) / 3;
    const mediaAnterior = diasUltimos7.slice(0, -3).reduce((sum, r) => sum + r.total, 0) / (diasUltimos7.length - 3);
    
    if (mediaRecente < mediaAnterior * 0.7) {
      anomalias.push({
        tipo: 'queda_consumo',
        severidade: 'alta',
        mensagem: `Consumo caiu ${((1 - mediaRecente/mediaAnterior) * 100).toFixed(0)}% nos últimos 3 dias`,
        recomendacao: 'Verificar saúde dos camarões e qualidade da água'
      });
    }
  }
  
  // Detectar FCR elevado
  if (viveiro.fcrAtual > 2.5) {
    anomalias.push({
      tipo: 'fcr_elevado',
      severidade: 'media',
      mensagem: `FCR de ${viveiro.fcrAtual.toFixed(2)} está acima do ideal`,
      recomendacao: 'Ajustar quantidade de ração e verificar desperdícios'
    });
  }
  
  // Detectar inconsistência na alimentação
  const diasAlimentados = viveiro.racoes.filter(r => r.total > 0).length;
  const diasTotais = viveiro.racoes.length;
  if (diasAlimentados < diasTotais * 0.8) {
    anomalias.push({
      tipo: 'inconsistencia_alimentacao',
      severidade: 'media',
      mensagem: `${((diasTotais - diasAlimentados) / diasTotais * 100).toFixed(0)}% dos dias sem alimentação registrada`,
      recomendacao: 'Manter consistência nos registros diários'
    });
  }
  
  return anomalias;
};
