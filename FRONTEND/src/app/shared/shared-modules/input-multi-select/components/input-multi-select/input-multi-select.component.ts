import { EventosGlobaisEnum } from './../../../../../core/services/siurbe/model/eventos-globais.enum';
import { EventEmitterService } from './../../../../../core/services/event-emitter.service';
import { InputMultiSelectService } from './../../services/input-multi-select.service';
import { AfterViewChecked, Component, EventEmitter, forwardRef, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, HostListener, TemplateRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { InputMultiselectConsultaEvt } from '../../models/input-multi-select-consulta.model';
import { InputMultiselectModel } from '../../models/input-multi-select.model';
@Component({
  selector: 'app-input-multi-select',
  templateUrl: './input-multi-select.component.html',
  styleUrls: ['./input-multi-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputMultiSelectComponent),
      multi: true
    }
  ]
})
export class InputMultiSelectComponent implements OnInit, OnDestroy, AfterViewChecked, ControlValueAccessor, OnChanges {

  onChange: any;
  onTouch: any;


  private inscricoes: Subscription[] = [];

  /**
   * Lista de opcoes disponiveis apos filtro com o atributo de consulta.
   */
  fonteDadosOpcoes: any[];

  /**
   * Lista de dados para o typehead pesquisar durante o filtro
   */
  @Input()
  fonteDadosItensDisponiveis: any[];

  /**
   * Caso false, o item selecionado não será adicionado na lista de itensSelecionados.
   * O evento ($adicionarItem) será emitido.
   */
  @Input()
  autoIncluir = true;

  /**
   * Remover automaticamente o item selecionado na lista de itens escolhidos, caso false será emitido o evento ($removerItem).
   */
  @Input()
  autoRemover = true;

  /**
   * Quantidade máxima de itens que podem ser adicionados. (0) Sem limite;
   */
  @Input()
  limiteItensSelecionados = 0;



  /**
   * Callback de verificação para filtro e existencia de item adicionado.
   */
  @Input()
  callbackFiltroAdicionarItem: (item: any, listaSelecionados: InputMultiselectModel<any>[]) => boolean;


  /**
   * Callback para validacao customizada para que o item possa ser adicionado na lista de itens disponíveis para escolha.
   * @description Verificar que o callback só é chamado caso a flag [repetirOpcoesSelecionadas] seja [FALSE];
   * @param cosultaStr String do valor de input
   * @param itemPassivoDeInclusao Item disponivel na lista de dados, para comparação e inclisao na lista de opcoes de escolha.
   * @param itensSelecionados Lista de itens que ja foram adicionados.
   * @returns TRUE caso o item possa ser adicionado a lista de opcoes disponíveis; FALSE caso contrário
   */
  @Input()
  callbackValidarAdicionarItemOpcoes: (consultaStr: string, itemPassivoDeInclusao: any, itensSelecionados: InputMultiselectModel<any>[]) => boolean;

  /**
   * Ao selecionar e adicionar um item, o Dropdown será removido.
   */
  @Input()
  fecharAoSelecionar = true;

  /**
   * Define o nome do atributo que será utlizado como flag para nao incluir o item automaticamente, e sim emitir um evento, caso o valor na posicao do atributo for TRUE.
   */
  @Input()
  nomePropriedadeFlagInterceptacao: string;

  /**
   * O FormControl sera notificado apenas com o valor que corresponde ao atributo identificador.
   */
  @Input()
  formSomenteAtributoIdentificador = false;

  itensSelecionados: InputMultiselectModel<any>[];

  /**
   * Nome do Atributo que sera listado e exibido na lista de opcoes do Dropdown
   */
  @Input()
  atributoExibicao: string;

  /**
   * Placeholder do input de consulta
   */
  @Input()
  placeholder: string;

  /**
   * Nome do Atributo que será utilizado para identificar os itens da lista.
   */
  @Input()
  atributoIdentificador: string;

  /**
   * Valor minimo de caractere que será necessario para iniciar a consulta.
   */
  @Input()
  valorMinimoConsulta = 1;


  @Input()
  repetirOpcoesSelecionadas = false;

  /**
   * Delay para iniciar configurar o (debounceTime) do input de consulta.
   */
  @Input()
  atraso = 500;

  /**
   * Evento emitido apos selecionar um item na lista de opções do Dropdown, caso a flag (autoIncluir) === FALSE.
   */
  @Output()
  $adicionarItem: EventEmitter<InputMultiselectModel<any>> = new EventEmitter();

  /**
   * Evento emitido apos tentar adicionar um item duplicado na lista.
   */
  @Output()
  $itemNaoAdicinado: EventEmitter<InputMultiselectModel<any>> = new EventEmitter();


  /**
   * Evento emitido apos selecionar um item na lista de itens selecionados, caso a flag (autoRemover) === FALSE.
   */
  @Output()
  $removerItem: EventEmitter<InputMultiselectModel<any>> = new EventEmitter();


  /**
   * Evento para consulta de valor.
   */
  @Output()
  $consultarValor: EventEmitter<string> = new EventEmitter();

  /**
   * Evento para consulta de valor.
   */
  @Output()
  $consultarAndFiltrarValores: EventEmitter<InputMultiselectConsultaEvt<any>> = new EventEmitter();

  @Input()
  obrigatorio = false;

  @Input()
  ngTemplateOutlet: TemplateRef<any>;

  @Input() ouvirArrayEmpty: boolean;

  @Input() ouvirStatus: boolean;

  mInputId: string;
  mDropId: string;

  private mDropElement: HTMLElement;


  formControl: FormControl;
  isDisabled: boolean;
  dropAberto: boolean;
  error: boolean;

  constructor(
    private inputMultiSelectService: InputMultiSelectService
  ) { }

  ngOnInit() {
    this.formControl = new FormControl();
    this.cadastrarEventos();
    this.definirId();
    this.observarError();
  }

  observarError() {
    if (this.ouvirArrayEmpty) {
      EventEmitterService.get(EventosGlobaisEnum.REQUISITOS_VAZIO).subscribe((error) => {
        this.error = error;
      });
    }

    if (this.ouvirStatus) {
      this.inputMultiSelectService.$error.subscribe(error => {
        this.error = error;
      });
    }
  }

  atribuirReferencias(): any {
    this.mDropElement = document.getElementById(this.mDropId);
  }

  definirId(): any {
    const genId = this.generateHashId();
    this.mInputId = `IMS_${genId}`;
    this.mDropId = `IMSD_${genId}`;
  }

  private generateHashId(): string {
    let nId = '';
    const possible = 'sdhfbashfbashfauyfesdfhvasjdfhvsjkvhfsajhfvsauvcsacyaeysdf'.toUpperCase();
    for (let i = 0; i < 5; i++) {
      nId += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    if (this.itensSelecionados) {
      const idExiste = this.itensSelecionados.some(x => x.id === nId);

      nId = idExiste ? this.generateHashId() : nId;
    }

    return nId;
  }

  cadastrarEventos(): any {
    this.inscricoes.push(
      this.formControl.valueChanges
        .pipe(
          debounceTime(this.atraso)
        )
        .subscribe(consultaStr => {
          if (consultaStr) {
            if (consultaStr.length >= this.valorMinimoConsulta) {
              // this.$consultarValor.emit(consultaStr);
              this.$consultarAndFiltrarValores.emit({
                executarListagem: (listaDatasource) => {
                  this.atualizarListaOpcoes(consultaStr, listaDatasource);
                },
                parametroConsulta: consultaStr
              });
            } else {
              this.fecharDrop();
            }
          } else {
            this.fecharDrop();
          }
        })
    );
  }

  private atualizarListaOpcoes(consultaStr: string, listaCustomizada?: any[]): any {
    const listasfiltro = this.fonteDadosItensDisponiveis || listaCustomizada;
    if (listasfiltro) {
      this.fonteDadosOpcoes = listasfiltro.filter(itemDisponivel => {
        return this.repetirOpcoesSelecionadas || (
          this.callbackValidarAdicionarItemOpcoes ? this.callbackValidarAdicionarItemOpcoes(consultaStr, itemDisponivel, this.itensSelecionados) :
            (this.validarItemNaoAdicionado(itemDisponivel) && this.stringIncludesValor(consultaStr, itemDisponivel[this.atributoExibicao])));
      });
      if (this.fonteDadosOpcoes.length > 0) {
        this.abrirDrop();
      }
    } else {
      this.fonteDadosOpcoes = [];
    }
  }

  validarItemNaoAdicionado(itemPassivoDeInclusao: any): any {
    if (this.itensSelecionados) {
      return !this.itensSelecionados.some(itemSelecionado => {
        return itemPassivoDeInclusao[this.atributoIdentificador] === itemSelecionado.item[this.atributoIdentificador];
      });
    }
    return true;
  }

  private stringIncludesValor(consultaStr: string, valorStr: string): boolean {
    if (valorStr && consultaStr) {
      return valorStr.toLowerCase().includes(consultaStr.toLowerCase());
    }
    return false;
  }

  ngOnDestroy(): void {
    this.inscricoes.forEach(sub => sub.unsubscribe());
  }

  selectItem(item: any) {
    this.adicionarItem(item);
  }

  private focus(): any {
    document.getElementById(this.mInputId).focus();
  }

  private limparInputAndDrop() {
    if (this.fecharAoSelecionar) {
      this.formControl.reset();
      this.fecharDrop();
      this.focus();
    }
  }

  private adicionarItem(item: any, byCallBack?: boolean): any {

    if (this.itensSelecionados === undefined) {
      this.itensSelecionados = [];
    }
    if (this.autoIncluir || byCallBack || (item[this.nomePropriedadeFlagInterceptacao] === true)) {
      // Verificar se o item ja está inserido
      const includes = this.callbackFiltroAdicionarItem ? !this.callbackFiltroAdicionarItem(item, this.itensSelecionados)
        : this.itensSelecionados.find(x => x.item[this.atributoExibicao] === item[this.atributoExibicao]) != null;

      const itemModel: InputMultiselectModel<any> = {
        id: this.generateHashId(),
        item
      };

      if (!includes && (
        this.limiteItensSelecionados !== 0 ? this.itensSelecionados.length < this.limiteItensSelecionados : true
      )) {
        this.itensSelecionados.push(itemModel);

        this.limparInputAndDrop();

        this.atualizarFormControl();
      } else {
        this.$itemNaoAdicinado.emit(itemModel);
      }
      this.atualizarListaOpcoes(
        this.formControl.value
      );
    } else if (!byCallBack) {
      const objCopy = {};
      Object.assign(objCopy, item);
      this.$adicionarItem.emit({
        id: this.generateHashId(),
        item: objCopy,
        appendMe: () => {
          this.adicionarItem(objCopy, true);
        }
      });
    }
  }

  interceptEnter(event) {
    return event.key != 'Enter';
  }

  private fecharDrop() {
    this.mDropElement = document.getElementById(this.mDropId);
    if (this.mDropElement) {
      this.mDropElement.classList.remove('show');
      this.dropAberto = false;
    }
  }

  private abrirDrop() {
    this.mDropElement = document.getElementById(this.mDropId);
    if (this.mDropElement) {
      if (!this.mDropElement.classList.contains('show')) {
        this.mDropElement.classList.add('show');
        this.dropAberto = true;
      }
    }
  }

  @HostListener('focus')
  focusIn() {
  }


  ngAfterViewChecked(): void {
    this.atribuirReferencias();
  }

  removerItem(inputMultiselectModel: InputMultiselectModel<any>, byCallBack = false) {
    if ((this.autoRemover || byCallBack)) {
      this.itensSelecionados.splice(this.itensSelecionados.findIndex(x => x.id === inputMultiselectModel.id), 1);
      this.atualizarFormControl();
    } else if (!byCallBack) {
      this.$removerItem.emit({
        item: inputMultiselectModel.item,
        id: inputMultiselectModel.id,
        removeMe: () => {
          this.removerItem(inputMultiselectModel, true);
        }
      });
    }
    this.atualizarListaOpcoes(
      this.formControl.value
    );
  }


  private atualizarFormControl() {
    if (this.onChange) {
      if (this.itensSelecionados.length > 0) {
        if (this.formSomenteAtributoIdentificador) {
          return this.onChange(this.itensSelecionados.map(itemModel => {
            return itemModel.item[this.atributoIdentificador];
          }));
        } else {
          return this.onChange(this.itensSelecionados.map(itemModel => {
            return itemModel.item;
          }));
        }
      }
      return this.onChange(null);
    }
  }

  writeValue(obj: any[]): void {
    if (obj != null) {
      this.itensSelecionados = obj.map((item): InputMultiselectModel<any> => {
        return {
          id: this.generateHashId(),
          item
        };
      });
    } else {
      this.itensSelecionados = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (this.formControl != null) {
      isDisabled ? this.formControl.disable() : this.formControl.enable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fonteDadosItensDisponiveis'] != null) {
      if (changes['fonteDadosItensDisponiveis'].currentValue !== undefined) {
        if (this.formControl) {
          this.atualizarListaOpcoes(
            this.formControl.value
          );
        }
      }
    }
  }

  isArquivo(arq) {
    if (arq === 'PDF' || arq === 'DWG' || arq === 'JPG-JPEG' || arq === 'PNG' || arq === 'XLS-XLSX') {
      return true;
    } else {
      return false;
    }
  }
}