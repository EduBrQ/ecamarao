import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { MensagemValidacaoEnum } from '../model/mensagem.validacao.enum';
import { environment } from 'environments/environment';

/**
 * Overwrite dos eventos de um FormControl, para atribuir a variavel nativeElements para obter a referencia do input utilizado.
 */

@Injectable()
export class ValidacaoFormularioService {


    /**
     * Metodo utilizado para varrer um formulário, encontrar os inputs que estão inválidos e disparar uma exceção informando uma mensagem
     * @param formGroup Formumalario necessario para verificar as validações presentes no mesmo.
     */
    validarFormulario(formGroup: FormGroup, nomeDoGrupo?: string) {
        if (formGroup !== undefined && formGroup != null) {
            if (formGroup.invalid) {
                Object.keys(formGroup.controls).forEach(nomeDoControle => {
                    const controle = formGroup.get(nomeDoControle);

                    if (controle instanceof FormGroup) {
                        this.validarFormulario(controle, nomeDoControle);
                    }

                    if (controle.invalid) {
                        const seletor = nomeDoGrupo != null ? `*[formGroupName=${nomeDoGrupo}] *[formControlName=${nomeDoControle}]` : `*[formControlName=${nomeDoControle}]`;
                        const elemento: HTMLElement = document.querySelector(seletor);

                        if (elemento === null) {
                            if (!environment.production) {
                                console.error(MensagemValidacaoEnum.A006.replace('{VALUE}', nomeDoControle), `[${nomeDoControle}]`);
                            }
                            return;
                        }
                        elemento.focus();
                        elemento.scrollIntoView({ behavior: 'smooth' });
                        const nomeElemento = elemento.getAttribute('name') || nomeDoControle;

                        if (nomeElemento === null) {
                            if (!environment.production) {
                                console.error(MensagemValidacaoEnum.A008.replace('{VALUE}', nomeDoControle), `[${nomeDoControle}]`);
                            }
                        }
                        this.verificarErros(controle, {
                            nome: nomeElemento,
                            element: elemento
                        });
                    }
                });
            }
        }
    }
    private verificarErros(controle: AbstractControl, opt: { nome: string; element: HTMLElement; }) {
        if (controle.hasError('required')) {
            throw new Error(MensagemValidacaoEnum.A003.replace('{VALUE}', opt.nome));

        } else if (controle.hasError('minlength')) {

            const minValue = controle.errors.minlength.requiredLength;
            if (minValue === undefined) {
                if (!environment.production) {
                    console.log(MensagemValidacaoEnum.A009, opt.element);
                }
                throw new Error(MensagemValidacaoEnum.E003);
            }
            throw new Error(MensagemValidacaoEnum.A005.replace('{VALUE}', opt.nome).replace('{MIN_VALUE}', minValue));

        } else if (
            controle.hasError('pattern')
            || controle.hasError('email')
            || controle.hasError('CpfCnpj')
            || controle.hasError('cpfCnpj')
            || controle.hasError('mEmail')
        ) {
            throw new Error(MensagemValidacaoEnum.A004.replace('{VALUE}', opt.nome));

        } else {
            if (!environment.production) {
                console.log(MensagemValidacaoEnum.A010.replace('{VALUE}', JSON.stringify(controle.errors)), opt.element);
            }
            throw new Error(MensagemValidacaoEnum.A007);
        }

    }
}
