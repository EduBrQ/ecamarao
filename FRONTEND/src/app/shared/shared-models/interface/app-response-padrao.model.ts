import { TipoAppResponseEnum } from '../enum/tipo-app-response.enum';

export interface AppResponsePadraoModel {
  type: TipoAppResponseEnum;
  msg: string;
}
