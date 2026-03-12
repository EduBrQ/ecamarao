import { DashboardResponse } from '../../../domains/fazenda/types';

/**
 * Serviço de API para comunicação com o backend
 */
export const backendApi = {
  /**
   * Busca dados do dashboard da fazenda
   */
  async getDashboardFazenda(): Promise<DashboardResponse> {
    // Implementação mock - substituir com chamada real à API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          viveiros: [],
          totais: {
            totalViveiros: 0,
            totalRacaoHoje: 0,
            totalRecomendado: 0,
            totalBiomassa: 0,
            totalRacaoAcumulada: 0,
            fcrMedio: 0,
            viveirosAlimentados: 0,
            viveirosParciais: 0,
            viveirosPendentes: 0
          },
          atualizado: new Date().toISOString()
        });
      }, 1000);
    });
  },

  /**
   * Registra alimentação de viveiro
   */
  async registrarAlimentacao(
    viveiroId: number, 
    periodo: 'manha' | 'tarde', 
    quantidade: number, 
    quantidadeManha?: number
  ): Promise<void> {
    // Implementação real aqui
    console.log('Registrando alimentação:', { viveiroId, periodo, quantidade, quantidadeManha });
  },

  /**
   * Registra alimentação em data específica
   */
  async registrarAlimentacaoEspecifica(
    viveiroId: number,
    data: string,
    periodo: 'manha' | 'tarde',
    quantidade: number,
    quantidadeManha?: number
  ): Promise<void> {
    // Implementação real aqui
    console.log('Registrando alimentação específica:', { viveiroId, data, periodo, quantidade, quantidadeManha });
  },

  /**
   * Busca coletas de ração de um viveiro
   */
  async getColetasRacao(viveiroId: string): Promise<any[]> {
    // Implementação real aqui
    console.log('Buscando coletas de ração:', viveiroId);
    return [];
  }
};
