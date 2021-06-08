import { StatusRequerimentoEnum } from '../enum/status-requerimento.enum';

export interface InfoRequerimentoModel {
    hashRequerimento: string;
    statusRequerimento: StatusRequerimentoEnum;
}