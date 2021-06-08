import { TiposBootstrap } from './tipos-bootstrap.enum';
export enum StatusRequerimentoEnum {
    CADASTRADO = 'CADASTRADO',
    CADASTRADO_AGUARDANDO_LI = 'CADASTRADO_AGUARDANDO_LI',
    ENVIADO = 'ENVIADO',
    ENVIADO_PARA_ANALISE = 'ENVIADO_PARA_ANALISE',
    EM_ANALISE = 'EM_ANALISE',
    ACATADO = 'ACATADO',
    NAO_ACATADO = 'NAO_ACATADO'
}

export const StatusRequerimentoEnumMensagem = {
    [StatusRequerimentoEnum.CADASTRADO]: 'Cadastrado',
    [StatusRequerimentoEnum.CADASTRADO_AGUARDANDO_LI]: 'Cadastrado – Aguardando LI',
    [StatusRequerimentoEnum.ENVIADO]: 'Enviado',
    [StatusRequerimentoEnum.ENVIADO_PARA_ANALISE]: 'Enviado para análise',
    [StatusRequerimentoEnum.EM_ANALISE]: 'Em análise documental',
    [StatusRequerimentoEnum.ACATADO]: 'Acatado',
    [StatusRequerimentoEnum.NAO_ACATADO]: 'Não Acatado',
};

export const StatusRequerimentoEnumBadge = {
    [StatusRequerimentoEnum.CADASTRADO]: TiposBootstrap.CADASTRADO,
    [StatusRequerimentoEnum.CADASTRADO_AGUARDANDO_LI]: TiposBootstrap.CADASTRADO_AGUARDANDO_LI,
    [StatusRequerimentoEnum.ENVIADO]: TiposBootstrap.ENVIADO,
    [StatusRequerimentoEnum.ENVIADO_PARA_ANALISE]: TiposBootstrap.ENVI_ANALISE,
    [StatusRequerimentoEnum.EM_ANALISE]: TiposBootstrap.ANALISE_DOCUMENTAL,
    [StatusRequerimentoEnum.ACATADO]: TiposBootstrap.ACATADO,
    [StatusRequerimentoEnum.NAO_ACATADO]: TiposBootstrap.NAO_ACATADO,
};
