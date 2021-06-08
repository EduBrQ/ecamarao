export interface InputMultiselectConsultaEvt<T> {
    parametroConsulta: string;
    executarListagem: (listaDatasource: T[]) => void;
}
