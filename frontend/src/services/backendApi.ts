import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Viveiro {
  id: number;
  nome: string;
  densidade: number;
  area: number;
  data_inicio_ciclo: string;
  status: string;
  created_at: string;
}

export interface Stats {
  users: number;
  viveiros: number;
  timestamp: string;
}

export interface ColetaRacao {
  id: number;
  viveiro_id: number;
  data: string;
  qntManha: number;
  qntTarde: number;
  created_at: string;
}

export interface Medicao {
  id: number;
  viveiro_id: number;
  data: string;
  oxigenio: number;
  ph: number;
  temperatura: number;
  alcalinidade: number;
  transparencia: number;
  salinidade: number;
  created_at: string;
}

export interface RegistroMortalidade {
  id: number;
  viveiro_id: number;
  data: string;
  quantidade: number;
  causa: string;
  created_at: string;
}

export interface Aerador {
  id: number;
  viveiro_id: number;
  nome: string;
  status: boolean;
  created_at: string;
}

export const backendApi = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Erro no health check:', error);
      throw error;
    }
  },

  // Usuários
  registerUser: async (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  },

  // Viveiros
  getViveiros: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar viveiros:', error);
      throw error;
    }
  },

  getViveiroById: async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar viveiro:', error);
      throw error;
    }
  },

  createViveiro: async (viveiroData: {
    nome: string;
    densidade: number;
    area: number;
    data_inicio_ciclo: string;
    status?: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/viveiros`, viveiroData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar viveiro:', error);
      throw error;
    }
  },

  updateViveiro: async (id: string, viveiroData: {
    nome?: string;
    densidade?: number;
    area?: number;
    data_inicio_ciclo?: string;
    status?: string;
  }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/viveiros/${id}`, viveiroData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar viveiro:', error);
      throw error;
    }
  },

  deleteViveiro: async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/viveiros/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar viveiro:', error);
      throw error;
    }
  },

  // Estatísticas
  getStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  },

  // ===== DASHBOARD DA FAZENDA =====
  
  getDashboardFazenda: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fazenda/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboard da fazenda:', error);
      throw error;
    }
  },

  // ===== COLETAS DE RAÇÃO =====
  
  getColetasRacao: async (viveiroId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros/${viveiroId}/racao`);
  return response.data.racoes || response.data; // compatibilidade
    } catch (error) {
      console.error('Erro ao listar coletas de ração:', error);
      throw error;
    }
  },

  createColetaRacao: async (viveiroId: string, racaoData: {
    data: string;
    qnt_manha: number;
    qnt_tarde: number;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/viveiros/${viveiroId}/racao`, racaoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar coleta de ração:', error);
      throw error;
    }
  },

  updateColetaRacao: async (viveiroId: string, id: string, racaoData: {
    data: string;
    qnt_manha: number;
    qnt_tarde: number;
  }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/viveiros/${viveiroId}/racao/${id}`, racaoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar coleta de ração:', error);
      throw error;
    }
  },

  deleteColetaRacao: async (viveiroId: string, id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/viveiros/${viveiroId}/racao/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar coleta de ração:', error);
      throw error;
    }
  },

  // ===== MEDIÇÕES DE QUALIDADE DA ÁGUA =====

  getMedicoes: async (viveiroId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros/${viveiroId}/medicoes`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar medições:', error);
      throw error;
    }
  },

  createMedicao: async (viveiroId: string, medicaoData: {
    data: string;
    oxigenio: number;
    ph: number;
    temperatura: number;
    alcalinidade: number;
    transparencia: number;
    salinidade: number;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/viveiros/${viveiroId}/medicoes`, medicaoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar medição:', error);
      throw error;
    }
  },

  updateMedicao: async (viveiroId: string, id: string, medicaoData: {
    data: string;
    oxigenio: number;
    ph: number;
    temperatura: number;
    alcalinidade: number;
    transparencia: number;
    salinidade: number;
  }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/viveiros/${viveiroId}/medicoes/${id}`, medicaoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar medição:', error);
      throw error;
    }
  },

  deleteMedicao: async (viveiroId: string, id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/viveiros/${viveiroId}/medicoes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar medição:', error);
      throw error;
    }
  },

  // ===== REGISTROS DE MORTALIDADE =====

  getRegistrosMortalidade: async (viveiroId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros/${viveiroId}/mortalidade`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar registros de mortalidade:', error);
      throw error;
    }
  },

  createRegistroMortalidade: async (viveiroId: string, mortalidadeData: {
    data: string;
    quantidade: number;
    causa: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/viveiros/${viveiroId}/mortalidade`, mortalidadeData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar registro de mortalidade:', error);
      throw error;
    }
  },

  updateRegistroMortalidade: async (viveiroId: string, id: string, mortalidadeData: {
    data: string;
    quantidade: number;
    causa: string;
  }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/viveiros/${viveiroId}/mortalidade/${id}`, mortalidadeData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar registro de mortalidade:', error);
      throw error;
    }
  },

  deleteRegistroMortalidade: async (viveiroId: string, id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/viveiros/${viveiroId}/mortalidade/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar registro de mortalidade:', error);
      throw error;
    }
  },

  // ===== AERADORES =====

  getAeradores: async (viveiroId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros/${viveiroId}/aeradores`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar aeradores:', error);
      throw error;
    }
  },

  createAerador: async (viveiroId: string, aeradorData: {
    nome: string;
    status: boolean;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/viveiros/${viveiroId}/aeradores`, aeradorData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar aerador:', error);
      throw error;
    }
  },

  updateAerador: async (viveiroId: string, id: string, aeradorData: {
    nome: string;
    status: boolean;
  }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/viveiros/${viveiroId}/aeradores/${id}`, aeradorData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar aerador:', error);
      throw error;
    }
  },

  deleteAerador: async (viveiroId: string, id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/viveiros/${viveiroId}/aeradores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar aerador:', error);
      throw error;
    }
  },

  // ===== SETUP =====
  
  setupDatabase: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/setup`);
      return response.data;
    } catch (error) {
      console.error('Erro ao configurar banco de dados:', error);
      throw error;
    }
  }
};
