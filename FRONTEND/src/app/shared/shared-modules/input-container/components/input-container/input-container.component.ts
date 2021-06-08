import { AfterContentInit, Component, ContentChild, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControlName } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { InputContainerDefault } from '../../models/input-container-const.model';

@Component({
  selector: 'app-input-container',
  templateUrl: './input-container.component.html',
  styleUrls: ['./input-container.component.css']
})
export class InputContainerComponent implements OnInit, OnDestroy, AfterContentInit {


  /**
   * @description Exibir apenas os erros listados
   * @example ['required','myError']
   */
  @Input() exibirApenasValidators: string[] = [];

  /**
   *  @description Exibir mensagem personalizada para cada erro.
   * @example [{'required':'Mensagem personalizada'}]
   */
  @Input() mensagemToValidators: [];

  /**
   * @deprecated As mensagem possuem um arquivi padrao, e podem ser personalizadas atraves do atributo "mensagemToValidators"
   */
  @Input() mensagemDeErro: string;

  /**
   * Class CSS customizada para o contanier do componente.
   */
  @Input() classContainer: string;

  /**
   * @description Caso False, não exibe o 'X' ao lado da mensagem
   */
  @Input() exibirClose = true;

  @ContentChild(FormControlName)
  private input: FormControlName;

  /**
   * Adicionar na validação se o input is touched
   */
  @Input() canValidTouch = false;

  /**
   * Adicionar na validação se o input is dirty
   */
  @Input() canValidDirty = true;


  private elementRef: HTMLElement;
  private label: HTMLElement;

  subscriptions: Subscription[] = [];

  mensagemErroAtual: string;

  ngOnInit() {
  }

  ngAfterContentInit() {
    if (this.input === undefined) {
      throw new Error('Esse componente precisa ser utlizado com uma diretiva formControlName');
    }
    this.carregarElementos();
    this.subscriptions = this.subscribers();
  }

  private carregarElementos(): any {
    const seletor = `*[formControlName=${this.input.name}]`;
    this.elementRef = document.querySelector(seletor);
    const lbSeletor = `*[for=${this.input.name}]`;
    this.label = document.querySelector(lbSeletor);
  }

  private subscribers(): Subscription[] {
    return [
      this.input.statusChanges
        .pipe(
          debounceTime(300)
        )
        .subscribe(() => {
          this.verificarEstado();
        })
    ];
  }

  private verificarEstado(): any {
    this.mensagemErroAtual = null;
    this.atribuirMensagem();
    this.atribuirEstado();
  }

  private atribuirMensagem(): void {
    if (this.isInvalid()) {
      const errorName = Object.keys(this.input.errors)[0];
      this.mensagemErroAtual = this.definirMensagem(errorName);
    }
  }

  private isInvalid(): boolean {
    if (this.input.errors != null) {
      const errorName = Object.keys(this.input.errors)[0];
      if (this.exibirApenasValidators.length > 0) {
        return this.exibirApenasValidators.includes(errorName);
      } else {
        return this.input.invalid;
      }
    }
    return false;
  }

  canClose(): boolean {
    return this.isInvalid() && this.exibirClose && this.mensagemErroAtual != null;
  }

  private atribuirEstado(): any {
    if (this.isInvalid()) {
      this.addClass(this.elementRef, 'is-invalid');
      this.addClass(this.label, 'label-error');
    } else {
      this.removeClass(this.elementRef, 'is-invalid');
      this.removeClass(this.label, 'label-error');
    }
  }

  private definirMensagem(validatorName: string): string {
    if (this.mensagemToValidators != null) {
      return this.getMensagemCustomizada(validatorName);
    }
    return this.getDefaultMessage(validatorName);
  }

  private getMensagemCustomizada(validatorName: string): any {
    try {
      const msg = this.mensagemToValidators.find(key => {
        return (key[validatorName]);
      })[validatorName];
      if (msg != null) {
        return msg;
      }
    } catch (error) {
      return this.getDefaultMessage(validatorName);
    }
  }

  private getDefaultMessage(validatorName: string): string {
    const msg = InputContainerDefault[0][validatorName];
    if (msg != null) {
      switch (validatorName) {
        case 'minlength':
          return msg.replace('{VALUE}', (this.input.errors.minlength.requiredLength || 'NOT_CONTENT'));
        case 'maxlength':
          return msg.replace('{VALUE}', (this.input.errors.maxlength.requiredLength || 'NOT_CONTENT'));
        default:
          return msg;
      }
    }
  }

  private addClass(element, classStr: string) {
    if (element != null && !element.classList.contains(classStr)) {
      element.classList.add(classStr);
    }
  }

  private removeClass(element, classStr: string) {
    if (element != null) {
      element.classList.remove(classStr);
    }
  }


  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
  }

}
