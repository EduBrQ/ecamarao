import { Component, ContentChild, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControlName, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MensagemInputRadio } from '../../input-lista-radio/models/mensagem-input-radio.enum';
import { InputListaCheckboxModel } from './model/input-lista-checkbox.model';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ngc-input-lista-checkbox',
  templateUrl: './input-lista-checkbox.component.html',
  styleUrls: ['./input-lista-checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputListaCheckboxComponent),
      multi: true
    }
  ]
})
export class InputListaCheckboxComponent implements OnInit, ControlValueAccessor {


  /**
    * Lista de Modelos que serão listados em forma de InputRadio.
    */
  @Input() listaCheckboxModel: InputListaCheckboxModel[];

  /**
   * Valor do Label exibido ao lado da lista de inputs.
   */
  @Input() valorLabel: string;

  /**
   * Define se a lista de input é de preenchimento obrigatório.
   */
  @Input() required: boolean;

  /**
   * Define a estrutura da listagem dos inputs, em linha ou empilhada.
   * Por default a lista é montada em linha.
   */
  @Input() inline = true;

  /**
   * Tamanho da coluna (Bootstrap) que o Label irá ocupar.
   */
  @Input() labelSize = 'col-2 text-right';

  /**
   * Tamanho da coluna (Bootstrap) que a lista de InputRadio irá ocupar.
   */
  @Input() bodySize = 'col-10';


  /**
   * Exibir um spinner de loading enquanto não houver dados na lista.
   */
  @Input() exibirLoading = false;

  @ContentChild(FormControlName) control: FormControlName;

  configCols = {
    colSize: 6,
    itensByCol: 3
  };

  onChange: any;
  onTouch: any;

  disabled = false;
  listaValoresSelecionados: any[] = [];

  constructor() { }

  ngOnInit() {
    if (this.control === undefined) {
      throw new Error(MensagemInputRadio.ERRO_DIRETIVA_FORM_CONTROL);
    }
  }

  writeValue(valorDoForm: any): void {
    if (valorDoForm !== null) {
      // tslint:disable-next-line:triple-equals
      if (valorDoForm instanceof Array) {
        valorDoForm.forEach(value => {
          const inputModel = this.listaCheckboxModel.find(x => x.valor === value);
          if (inputModel !== undefined) {
            this.listaValoresSelecionados.push(inputModel);
            inputModel.checked = true;
          }
        });
      }
    } else {
      this.reset();
      this.validarDefaults();
    }
        this.listaCheckboxModel.forEach(valor => {
          valor.checked ? valor.checked = true : valor.checked = false;
        });

  }
  validarDefaults(): any {
    if (this.listaCheckboxModel !== undefined) {
      this.listaCheckboxModel.forEach(val => {
        val.checked = val.default === true;
      });
    }
  }

  private reset(): any {
    if (this.listaCheckboxModel !== undefined) {
      this.listaValoresSelecionados = [];
      this.listaCheckboxModel.forEach(val => {
        val.checked = false;
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setValue(valor: any, event) {
    valor.checked ? valor.checked = false : valor.checked = true;

    if (!this.disabled) {
      const insert = event.target.checked;
      // tslint:disable-next-line:no-console
      if (insert && !this.listaValoresSelecionados.includes(valor)) {
        // valor.checked = false;
        this.listaValoresSelecionados.push(valor);
      } else {
        this.listaValoresSelecionados = this.listaValoresSelecionados.filter(x => x !== valor);
      }
      const mapper = this.listaValoresSelecionados.map(x => {
        return x.valor;
      });
      this.onChange(mapper.length <= 0 ? null : mapper);
    }
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

}
