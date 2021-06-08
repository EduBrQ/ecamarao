import { TokenJwtModel } from './jwt-token.model';

export interface UsuarioAutenticadoModel {
    tipo: string;
    token: string;
    refreshToken: string;
    tokenModelo: TokenJwtModel;
}
