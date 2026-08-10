import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

const TOKEN_KEY = 'ecamarao_token';

const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
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
  viveiroId: number;
  data: string;
  qntManha: number;
  qntTarde: number;
  created_at: string;
}

export interface Medicao {
  id: number;
  viveiroId: number;
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
  viveiroId: number;
  data: string;
  quantidade: number;
  causa: string;
  created_at: string;
}

export interface Aerador {
  id: number;
  viveiroId: number;
  nome: string;
  status: boolean;
  created_at: string;
}

export const auth = {
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),

  login: async (username: string, password: string) => {
    const response = await http.post('/api/auth/login', { username, password });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    return response.data.user as AuthUser;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  me: async () => {
    const response = await http.get('/api/auth/me');
    return response.data as AuthUser;
  },
};

export const backendApi = {
  healthCheck: async () => {
    const response = await http.get('/health');
    return response.data;
  },

  // ===== VIVEIROS =====

  getViveiros: async (): Promise<Viveiro[]> => {
    const response = await http.get('/api/viveiros');
    return response.data;
  },

  getViveiroById: async (id: string): Promise<Viveiro> => {
    const response = await http.get(`/api/viveiros/${id}`);
    return response.data;
  },

  createViveiro: async (viveiroData: {
    nome: string;
    densidade: number;
    area: number;
    data_inicio_ciclo: string;
    status?: string;
  }): Promise<Viveiro> => {
    const response = await http.post('/api/viveiros', viveiroData);
    return response.data;
  },

  updateViveiro: async (id: string, viveiroData: {
    nome?: string;
    densidade?: number;
    area?: number;
    data_inicio_ciclo?: string;
    status?: string;
  }): Promise<Viveiro> => {
    const response = await http.put(`/api/viveiros/${id}`, viveiroData);
    return response.data;
  },

  deleteViveiro: async (id: string) => {
    const response = await http.delete(`/api/viveiros/${id}`);
    return response.data;
  },

  // ===== ESTATÍSTICAS E DASHBOARD =====

  getStats: async (): Promise<Stats> => {
    const response = await http.get('/api/stats');
    return response.data;
  },

  getDashboardFazenda: async () => {
    const response = await http.get('/api/dashboard');
    return response.data;
  },

  // ===== COLETAS DE RAÇÃO =====

  getColetasRacao: async (viveiroId: string): Promise<ColetaRacao[]> => {
    const response = await http.get(`/api/viveiros/${viveiroId}/racao`);
    return response.data;
  },

  createColetaRacao: async (viveiroId: string, racaoData: {
    data: string;
    qnt_manha: number;
    qnt_tarde: number;
  }): Promise<ColetaRacao> => {
    const response = await http.post(`/api/viveiros/${viveiroId}/racao`, racaoData);
    return response.data;
  },

  updateColetaRacao: async (viveiroId: string, id: string, racaoData: {
    data: string;
    qnt_manha: number;
    qnt_tarde: number;
  }): Promise<ColetaRacao> => {
    const response = await http.put(`/api/viveiros/${viveiroId}/racao/${id}`, racaoData);
    return response.data;
  },

  deleteColetaRacao: async (viveiroId: string, id: string) => {
    const response = await http.delete(`/api/viveiros/${viveiroId}/racao/${id}`);
    return response.data;
  },

  // ===== MEDIÇÕES DE QUALIDADE DA ÁGUA =====

  getMedicoes: async (viveiroId: string): Promise<Medicao[]> => {
    const response = await http.get(`/api/viveiros/${viveiroId}/medicoes`);
    return response.data;
  },

  createMedicao: async (viveiroId: string, medicaoData: {
    data: string;
    oxigenio: number;
    ph: number;
    temperatura: number;
    alcalinidade: number;
    transparencia: number;
    salinidade: number;
  }): Promise<Medicao> => {
    const response = await http.post(`/api/viveiros/${viveiroId}/medicoes`, medicaoData);
    return response.data;
  },

  updateMedicao: async (viveiroId: string, id: string, medicaoData: {
    data: string;
    oxigenio: number;
    ph: number;
    temperatura: number;
    alcalinidade: number;
    transparencia: number;
    salinidade: number;
  }): Promise<Medicao> => {
    const response = await http.put(`/api/viveiros/${viveiroId}/medicoes/${id}`, medicaoData);
    return response.data;
  },

  deleteMedicao: async (viveiroId: string, id: string) => {
    const response = await http.delete(`/api/viveiros/${viveiroId}/medicoes/${id}`);
    return response.data;
  },

  // ===== REGISTROS DE MORTALIDADE =====

  getRegistrosMortalidade: async (viveiroId: string): Promise<RegistroMortalidade[]> => {
    const response = await http.get(`/api/viveiros/${viveiroId}/mortalidade`);
    return response.data;
  },

  createRegistroMortalidade: async (viveiroId: string, mortalidadeData: {
    data: string;
    quantidade: number;
    causa: string;
  }): Promise<RegistroMortalidade> => {
    const response = await http.post(`/api/viveiros/${viveiroId}/mortalidade`, mortalidadeData);
    return response.data;
  },

  updateRegistroMortalidade: async (viveiroId: string, id: string, mortalidadeData: {
    data: string;
    quantidade: number;
    causa: string;
  }): Promise<RegistroMortalidade> => {
    const response = await http.put(`/api/viveiros/${viveiroId}/mortalidade/${id}`, mortalidadeData);
    return response.data;
  },

  deleteRegistroMortalidade: async (viveiroId: string, id: string) => {
    const response = await http.delete(`/api/viveiros/${viveiroId}/mortalidade/${id}`);
    return response.data;
  },

  // ===== AERADORES =====

  getAeradores: async (viveiroId: string): Promise<Aerador[]> => {
    const response = await http.get(`/api/viveiros/${viveiroId}/aeradores`);
    return response.data;
  },

  createAerador: async (viveiroId: string, aeradorData: {
    nome: string;
    status: boolean;
  }): Promise<Aerador> => {
    const response = await http.post(`/api/viveiros/${viveiroId}/aeradores`, aeradorData);
    return response.data;
  },

  updateAerador: async (viveiroId: string, id: string, aeradorData: {
    nome: string;
    status: boolean;
  }): Promise<Aerador> => {
    const response = await http.put(`/api/viveiros/${viveiroId}/aeradores/${id}`, aeradorData);
    return response.data;
  },

  deleteAerador: async (viveiroId: string, id: string) => {
    const response = await http.delete(`/api/viveiros/${viveiroId}/aeradores/${id}`);
    return response.data;
  },
};
