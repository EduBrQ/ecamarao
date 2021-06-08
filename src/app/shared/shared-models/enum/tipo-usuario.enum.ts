export enum TipoUsuarioEnum {
  PROPRIETARIO = 'PROPRIETARIO',
  RESP_TECNICO = 'RESP_TECNICO',
  INTERNO      = 'INTERNO'
}

export const TipoUsuarioMensagemEnum = {
  [TipoUsuarioEnum.PROPRIETARIO]: 'PROPRIETARIO',
  [TipoUsuarioEnum.RESP_TECNICO]: 'RESPONSAVEL_TECNICO',
  [TipoUsuarioEnum.INTERNO]: 'INTERNO',
}