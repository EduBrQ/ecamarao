import { StatusRequerimentoEnum } from './../../../../../shared-models/enum/status-requerimento.enum';
import { SimNaoEnum } from '@shared/models/enum/sim-nao.enum';

export class FiltroBuscarRequerimentosDTO {
    status: StatusRequerimentoEnum;
    hashRequerimento: string;
    zonaFiscal: string;
    quarteirao: string;
    lote: string;
    iptu: string;
    nomeResponsavelTecnico: string;
    nomeProprietario: string;
    cpfCnpjResponsavelTecnico: string;
    cpfCnpjProprietario: string;
    guiasPagasOuIsentas: number;
    numeroGuia: string;
    requerimentoDoResponsavel: SimNaoEnum;
    pagina: number;
}
