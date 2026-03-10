/**
 * Utilitários para manipulação de datas
 */

/**
 * Normaliza data para formato YYYY-MM-DD
 * @param date - Data para normalizar
 * @returns Data normalizada em formato string
 */
export const normalizeDate = (date: string | Date): string => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return '';
};

/**
 * Formata data para exibição em português brasileiro
 * @param date - Data para formatar
 * @returns Data formatada
 */
export const formatDateBR = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Verifica se a data é hoje
 * @param date - Data para verificar
 * @returns True se for hoje
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};
