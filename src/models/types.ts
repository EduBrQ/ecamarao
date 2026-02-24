export interface ViveiroDTO {
  id: number;
  tamanho?: number;
  ipCamera?: string;
  densidade?: number;
  latitude?: string;
  longitude?: string;
  laboratorio?: string;
  proprietario?: string;
  dataInicioCiclo?: string;
}

export interface AeradorDTO {
  id: number;
  nome: string;
  status: boolean;
}

export interface ColetaRacao {
  id: number;
  data: Date | string;
  qntManha: number;
  qntTarde: number;
}

export interface Medicao {
  id: number;
  data: Date | string;
  oxigenio: number;
  ph: number;
  temperatura: number;
  alcalinidade: number;
  dureza: number;
  transparencia: number;
}

export interface Camera {
  id: number;
  ipCamera: string;
}

export interface Feedback {
  id: number;
  medida: string;
  condicao: string;
  manejo?: string;
  descricao: string;
}
