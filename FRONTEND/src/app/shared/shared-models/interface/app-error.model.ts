import { MensagemEnum } from '../enum/mensagem.enum';

export class AppError {
    constructor(public mensage: string = MensagemEnum.ERRO_DESCONHECIDO) { }
}
