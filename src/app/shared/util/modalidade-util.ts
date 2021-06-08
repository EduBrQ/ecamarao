import { ModalidadeParcelamentoEnumMensagem, ModalidadeParcelamentoEnum } from './../../modules/private/modules/requerimento/modules/cadastro-requerimento/models/enum/modalidade-parcelamento.enum';

const formatarModalidade = (modalidadeEnum: ModalidadeParcelamentoEnum) => {
    return ModalidadeParcelamentoEnumMensagem[modalidadeEnum];
}

export {
    formatarModalidade
}