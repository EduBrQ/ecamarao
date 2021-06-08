export interface TokenJwtModel {
    id: number;
    nome: string;
    documento: string;
    perfilLogado: CodigoPerfilEnum;
    perfis: PerfilJwtModel[];
    iat: number;
    exp: number;
}

export interface PerfilJwtModel {
    codigo: CodigoPerfilEnum;
    nome: string;
    permissoes: PermissoesJwtModel[];
}
export interface PermissoesJwtModel {
    codigo: CodigoPermissaoEnum;
    nome: string;
}

export enum CodigoPerfilEnum {
    PERFIL_DESCONHECIDO = 'PERFIL_DESCONHECIDO',
    PERFIL_REQ_TDC = 'PERFIL_REQ_TDC',
    PERFIL_REQ_BPH = 'PERFIL_REQ_BPH',
    PERFIL_ODC_PROPRIETARIO = 'PERFIL_ODC_PROPRIETARIO',
    PERFIL_ODC_RT = 'PERFIL_ODC_RT',
    SIPU_SIATU = 'SIPU_SIATU',
    USC03117 = 'USC.03.117',
    USC03168 = 'USC.03.168',
    USC03119 = 'USC.03.119',
    USC03116 = 'USC.03.116',
    USC03120 = 'USC.03.120',
    USC03123 = 'USC.03.123',
    USC03137 = 'USC.03.137',
    USC03124 = 'USC.03.124',
    USC03285 = 'USC.03.285',
    USC03131 = 'USC.03.131',
    USC03286 = 'USC.03.286',
    USC03135 = 'USC.03.135',
    USC03136 = 'USC.03.136',
    USC03126 = 'USC.03.126', // Manter a comissao TDC
    USC03127 = 'USC.03.127', // Manter a comissao BPH
    USC03128 = 'USC.03.128', // Manter tipo documento
    USC03129 = 'USC.03.129', // Manter template email
    USC03132 = 'USC.03.132', // Manter mensagens por documento
    USC03134 = 'USC.03.134', // Manter parametros
    USC03139 = 'USC.03.139', // Cadastrar formulas
    USC03230 = 'USC.03.230', // Visualizar aba Historico
    USC03231 = 'USC.03.231', // Adicionar laudo TDC Cultural
    USC03283 = 'USC.03.283', // Adicionar Laudo TDC Taxa Permeabilidade
    USC03284 = 'USC.03.284', // Adicionar Laudo TDC Taxa Relevancia
    USC03282 = 'USC.03.282', // Designar Analise Documental Gerador TDC
    USC03248 = 'USC.03.248', // Designar Analise Tecnica Gerador TDC
    USC03250 = 'USC.03.250', // Meus requerimentos designados analise tec, e executar analise tecnica
    USC03260 = 'USC.03.260', // Gerar relatorio TDC
    USC03261 = 'USC.03.261', // Gerenciar Guias
    USC03262 = 'USC.03.262', // Isentar Guias
    USC03263 = 'USC.03.263', // Acatar Administrativamente
    USC03265 = 'USC.03.265', // Enviar para analise de interface
    USC03266 = 'USC.03.266', // Atender interface GECOE
    USC03258 = 'USC.03.258', // Atender interface GEINC
    USC03259 = 'USC.03.259', // Atender interface GELED
    USC03278 = 'USC.03.278', // Designar Recurso
    USC03280 = 'USC.03.280', // Atender Recurso
    USC03281 = 'USC.03.281', // Gerar Certidao TDC
    USC03180 = 'USC.03.180', // Emitir Certidao TDC Receptor
    USC03154 = 'USC.03.154', // Designar analise Documental Receptor TDC
    USC03155 = 'USC.03.155', // Meus Requerimentos Designados Receptor TDC
    USC03156 = 'USC.03.156', // Executar analise documental receptor TDC
    USC03167 = 'USC.03.167', // Executar analise tecnica Receptor TDC
    USC03235 = 'USC.03.235', // Manter analise documental Gerador TDC
    USC03257 = 'USC.03.257', // Implementar (Acessar a aba de dados administrativos, executar analise tec dos anexos do requerimento) de Gerador TDC
    USC03173 = 'USC.03.173', // Implementar (Acessar a aba de dados administrativos) de Receptor TDC, Bloquear adminstrativamente gerador TDC, Monitoramento Interno
    USC03268 = 'USC.03.268', // Executar analise de comissao
}
export enum CodigoPermissaoEnum {
    CONSULTAR = 'CONSULTAR',
    GRAVAR = 'GRAVAR'
}
