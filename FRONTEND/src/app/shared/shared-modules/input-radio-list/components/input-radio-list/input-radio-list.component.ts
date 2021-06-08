import { Component, ContentChild, forwardRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormControlName, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputListaRadioModel } from '../../models/input-lista-radio.model';
import { MensagemInputRadio } from '../../models/mensagem-input-radio.enum';


@Component({
  selector: 'app-input-radio-list',
  templateUrl: './input-radio-list.component.html',
  styleUrls: ['./input-radio-list.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputRadioListComponent),
      multi: true
    }
  ]
})
export class InputRadioListComponent implements OnInit, ControlValueAccessor, OnChanges {


  /**
   * Lista de Modelos que serão listados em forma de InputRadio.
   */
  @Input() listaRadioModel: InputListaRadioModel[];
  mListaRadioModel: InputListaRadioModel[];

  /**
   * Define a estrutura da listagem dos inputs, em linha ou empilhada.
   * Por default a lista é montada em linha.
   */
  @Input() inline = true;

  /**
   * Tamanho da coluna (Bootstrap) que a lista de InputRadio irá ocupar.
   */
  @Input() bodySize = 'col-10';


  /**
   * Exibir um spinner de loading enquanto não houver dados na lista.
   */
  @Input() exibirLoading = false;

  @ContentChild(FormControlName) control: FormControlName;

  ultimoValorSelecionado: InputListaRadioModel;

  onChange: any;
  onTouch: any;

  disabled = false;

  constructor() {
  }

  ngOnInit() {
    if (this.control === undefined) {
      throw new Error(MensagemInputRadio.ERRO_DIRETIVA_FORM_CONTROL);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listaRadioModel'] != null) {
      if (changes['listaRadioModel'].currentValue !== undefined) {
        this.mapearLista(changes['listaRadioModel'].currentValue);
      }
    }
  }
  private mapearLista(lista: any) {
    if (lista != null) {
      this.listaRadioModel = lista;
      this.mListaRadioModel = this.listaRadioModel.map(x => {
        return Object.assign({}, x);
      });
    }
  }
  writeValue(valorDoForm: any): void {
    this.reset();
    if (valorDoForm !== null) {
      // tslint:disable-next-line:triple-equals
      const objSelecionado: InputListaRadioModel = this.mListaRadioModel.find(x => x.valor == valorDoForm);
      if (objSelecionado !== undefined) {
        objSelecionado.checked = true;
        this.ultimoValorSelecionado = objSelecionado;
      }
    } else {
      this.validarDefaults();
    }
  }

  validarDefaults(): any {
    if (this.mListaRadioModel !== undefined) {
      this.mListaRadioModel.forEach(val => {
        val.checked = val.default === true;
      });
    }
  }

  private reset(): any {
    if (this.mListaRadioModel !== undefined) {
      this.mListaRadioModel.forEach(val => {
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

  setValue(valor: any) {
    if (!this.disabled) {
      this.ultimoValorSelecionado = valor;
      this.mListaRadioModel.forEach(val => {
        val.checked = valor === val;
      });
      this.onChange(this.ultimoValorSelecionado.valor);
    }
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

}
