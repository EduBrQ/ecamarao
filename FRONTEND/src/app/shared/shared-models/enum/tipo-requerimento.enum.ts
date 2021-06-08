export enum TipoRequerimentoEnum {
    VERIFICACAO_ORIGEM = 1,
    APROVACAO_PARCELAMENTO_SOLO = 2
}

export const TipoRequerimentoEnumMensagem = {
    [TipoRequerimentoEnum.VERIFICACAO_ORIGEM]: 'Verificação de origem de lote',
    [TipoRequerimentoEnum.APROVACAO_PARCELAMENTO_SOLO]: 'Aprovacao de Parcelamento do Solo'
};
