import { AbstractControl } from '@angular/forms';
import { ValidacaoUtils } from './validacao-util-const.mode';

export const ValidacaoFormularioValidators = {
    validacaoEmail: (control: AbstractControl) => {
        if (/^([0-9a-z])\.{0,1}([a-z0-9-_]{1,}\.{0,1}){1,}[^.@@.$%*&#!*+_-](@){1}([^@.$%*&#!*'+_-]{1}[a-z0-9_-]*\.{1}){1,}[a-z0-9]{1,}[a-z0-9]$/.test(control.value)) {
            return null;
        }
        return { mEmail: true };
    },
    validacaoTelefone: (control: AbstractControl) => {
        if (String(control.value).length > 0) {
            if (!(/\d{10}/g.test(control.value))) {
                return { phone: true };
            }
        }
        return null;
    },
    validacaoCpfCnpj: (control: AbstractControl) => {
        if (control.value != null) {
            if (ValidacaoUtils.validarCPf(control.value) || ValidacaoUtils.validarCnpj(control.value)) {
                return null;
            }
        }
        return { cpfCnpj: true };
    }
};
