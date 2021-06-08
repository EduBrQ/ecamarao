import { FormGroup } from '@angular/forms';
const removeElementosObj = (object: any) => {
    for (const key in object) {
        if (!object[key]) {
            delete object[key];
        }
    }
    return object;
};

const removeDuplicadosArray = <T>(array: Array<T>, key: string ) => {
    const novoArray = new Set();
    return array.filter(
        obj => !novoArray.has(obj[key]) && novoArray.add(obj[key])
    );
};

const ativarMensagensErros = (form: FormGroup) => {
    Object.keys(form.controls).forEach(ctrl => {
        form.get(ctrl).updateValueAndValidity();
    });
};

export {
    removeElementosObj,
    ativarMensagensErros,
    removeDuplicadosArray
};
