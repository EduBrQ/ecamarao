import { TipoRequerimentoEnum } from '@shared/models/enum/tipo-requerimento.enum';
import { StatusRequerimentoEnum } from '@shared/models/enum/status-requerimento.enum';

export interface ResultadoBuscaRequerimentoDTO {
    idRequerimento: number;
    numeroRequerimento: string;
    tipo: TipoRequerimentoEnum;
    iptu: string;
    ultimaAlteracao: string;
    status: StatusRequerimentoEnum;
    abrvStatus?: string;
    ultimaAtualizacao?: string;
}