import { TipoLogado } from '../enum/tipo-logado.enum';
import { TokenJwtModel } from './../class/jwt-token.model';

export interface AutenticacaoModel {
    documento: string;
    tipo: string;
    token: string;
    tokenModelo?: TokenJwtModel;
    refreshToken?: string;
    tipoUsuario: TipoLogado;
    nomeUsuario: string;
}
