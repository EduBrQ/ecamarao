export interface InputMultiselectModel<T> {
    id: string;
    item: T;
    appendMe?: () => void;
    removeMe?: () => void;
}
