import { HttpUtilsService } from './../../../../core/services/http-utils.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthControlService } from '@core/services/auth-control.serice';
import { PaginaPublicaModel } from '@shared/models/class/pagina-publica.model';
import { MensagemEnum } from '@shared/models/enum/mensagem.enum';
import { SimNaoEnum } from '@shared/models/enum/sim-nao.enum';
import { StatusRequerimentoEnum, StatusRequerimentoEnumMensagem } from '@shared/models/enum/status-requerimento.enum';
import { AutenticacaoModel } from '@shared/models/interface/autenticacao.model';
import { GuiaService } from 'app/shared/shared-services/guias.service';
import { ToastrService } from 'ngx-toastr';
import { RequerimentoService } from '../../../shared-services/requerimento.service';
import { StatusDTO } from './../../../../modules/private/modules/documentacao/models/status-requerimento-dto.model';
import { FiltroBuscarRequerimentosDTO } from './models/class/filtro-buscar-requerimentos-dto.model';
import { ResultadoBuscaRequerimentoDTO } from './models/interface/resultado-busca-requerimento-dto.model';
import { SelecaoGuiaDTO } from './models/interface/selecao-guias-dto.model';
import { isEmpty } from 'app/shared/util/object-util';

@Component({
  selector: 'app-pesquisar-requerimento',
  templateUrl: './pesquisar-requerimento.component.html',
  styleUrls: ['./pesquisar-requerimento.component.css']
})
export class PesquisarRequerimentoComponent implements OnInit {
  usuarioLogado: AutenticacaoModel;
  formPesquisaRequerimento: FormGroup;
  filtroBuscarRequerimentos: FiltroBuscarRequerimentosDTO;
  mostrarZonaFiscal: boolean;
  mostrarNumeroDaGuia: boolean;
  paginaAtual: PaginaPublicaModel<ResultadoBuscaRequerimentoDTO>;
  public statusList: Array<StatusDTO>;
  numeroPagina: number;
  flagExibirMeusReq: boolean;
  tituloContainer: any;
  guias: SelecaoGuiaDTO[];

  idRequerimento: number;
  queryParamsRoute: Object;

  constructor(
    private authControlService: AuthControlService,
    private formBuilder: FormBuilder,
    private requerimentoService: RequerimentoService,
    private router: Router,
    private toastService: ToastrService,
    private authService: AuthControlService,
    private guiasService: GuiaService,
    private httpUtilsService: HttpUtilsService,
    private activatedRoute: ActivatedRoute
  ) {
    this.mostrarZonaFiscal = true;
    this.mostrarNumeroDaGuia = true;
    this.guias = [];
    this.filtroBuscarRequerimentos = new FiltroBuscarRequerimentosDTO();
  }

  ngOnInit() {
    this.usuarioLogado = this.authControlService.getUsuarioLogado();
    this.flagUsuarioLogado();
    this.paginaAtual = new PaginaPublicaModel();
    this.criarForm();
    this.preencherListaDeStatus();
    this.desabilitarCampos('quarteirao', 'zonaFiscal');
    this.desabilitarCampos('lote', 'quarteirao');
    this.consultarGuias();
    this.verificarQueryParams();
  }

  permissaoUsuario() {
    if (this.authService.getUsuarioLogado()) {
      switch (this.authService.getTipoUsuario().toString()) {
        case 'INTERNO':
          return true;
        case 'RESPONSAVEL_TECNICO':
          return true;
        case 'PROPRIETARIO':
          return false;
      }
    }
  }

  flagUsuarioLogado() {
    if (!this.usuarioLogado) {
      this.flagExibirMeusReq = false;
      this.tituloContainer = null;
    } else {
      this.tituloContainer = 'Pesquisar Requerimento';
      this.flagExibirMeusReq = true;
    }
  }

  preencherListaDeStatus(): void {
    this.requerimentoService.getStatusList().subscribe((listaStatus: Array<StatusDTO>) => {
      this.statusList = listaStatus.map(status => {
        status['codigo'] = status.nomeStatusRequerimento;
        status['nome'] = StatusRequerimentoEnumMensagem[status.nomeStatusRequerimento];
        return status;
      });

    }, (error) => {
      this.toastService.error(
        error && error.error[0] && error.error[0].msg ? error.error[0].msg : MensagemEnum.ERRO_DESCONHECIDO
      );
    });
  }

  /**
   * @description criação do formulário
   */
  private criarForm(): void {
    this.formPesquisaRequerimento = this.formBuilder.group({
      status: [''],
      hashRequerimento: [''],
      zonaFiscal: [''],
      quarteirao: [{ value: '', disabled: true }],
      lote: [{ value: '', disabled: true }],
      iptu: [''],
      nomeResponsavelTecnico: [''],
      nomeProprietario: [''],
      cpfCnpjResponsavelTecnico: [''],
      cpfCnpjProprietario: [''],
      guiasPagasOuIsentas: [''],
      numeroGuia: [''],
      requerimentoDoResponsavel: ['']
    });
  }

  /**
   * @description verifica se o campoReferência está preenchido para habilitar o campoDesabilitado
   * @param campoDesabilitado campo do formulário que está desabilitado
   * @param campoReferencia campo de referência para habilitar ou não o outro campo
   */
  desabilitarCampos(campoDesabilitado: string, campoReferencia: string): any {
    this.formPesquisaRequerimento.get(campoReferencia).valueChanges.subscribe(value => {
      if (value !== '') {
        this.formPesquisaRequerimento.get(campoDesabilitado).enable();
      } else {
        this.formPesquisaRequerimento.get(campoDesabilitado).reset({ value: '', disabled: true });
      }
    });
  }

  /**
   * @description verifica se o campo Índice Cadastral está preenchido para exibir os campos zonaFiscal,quarteirao e lote
   */
  exibirZonaFiscal(): boolean {
    this.formPesquisaRequerimento.get('iptu').valueChanges.subscribe(value => {
      this.mostrarZonaFiscal = value === '';
      if (value !== '') {
        this.formPesquisaRequerimento.get('zonaFiscal').reset();
        this.formPesquisaRequerimento.get('quarteirao').setValue('');
        this.formPesquisaRequerimento.get('quarteirao').disable();
        this.formPesquisaRequerimento.get('lote').setValue('');
        this.formPesquisaRequerimento.get('lote').disable();
      }
    });
    return this.mostrarZonaFiscal;
  }

  exibirNumeroDaGuia() {
    this.formPesquisaRequerimento.get('guiasPagasOuIsentas').valueChanges.subscribe(value => {
      this.mostrarNumeroDaGuia = value === '';
    });

    return this.mostrarNumeroDaGuia;
  }

  /**
   * @description método responsável por chamar o service passando o objeto de consulta
   */
  pesquisar(pagina?: number): void {
    pagina ? this.numeroPagina = pagina : this.numeroPagina = 1;
    this.filtroBuscarRequerimentos = this.formPesquisaRequerimento.getRawValue();
    this.filtroBuscarRequerimentos.pagina = this.numeroPagina;
    this.setQueryParams(this.filtroBuscarRequerimentos);
    this.requerimentoService.buscarRequerimentos(this.filtroBuscarRequerimentos)
      .subscribe((response: PaginaPublicaModel<ResultadoBuscaRequerimentoDTO>) => {
        this.paginaAtual = response;
      });
  }

  private verificarQueryParams() {
    this.queryParamsRoute = this.activatedRoute.snapshot.queryParams;
    if (!isEmpty(this.queryParamsRoute)) {
      Object.keys(this.queryParamsRoute).forEach((param) => {
        if (param != 'pagina') {
          this.formPesquisaRequerimento.get(param).setValue(this.queryParamsRoute[param]);
        }
        if (this.formPesquisaRequerimento.get('guiasPagasOuIsentas').value) {
          this.mostrarNumeroDaGuia = false;
        }
      });
      this.pesquisar(Number(this.queryParamsRoute['pagina']));
    }
  }

  private setQueryParams(params) {
    const paramsFilter = this.httpUtilsService.httpParamsByObjeto(params);
    this.router.navigate([], { queryParams: paramsFilter });
  }

  mapearAbrvStatus(paginaAtual: PaginaPublicaModel<ResultadoBuscaRequerimentoDTO>) {
    const itens = paginaAtual.itens;
    itens.forEach(item => item.abrvStatus = item.status === StatusRequerimentoEnum.ENVIADO ? 'env' : 'cdst');
  }

  trocarPagina(numeroPagina: number) {
    this.pesquisar(numeroPagina);
  }

  checkValueGuiasPagas(event) {
    const controlValue = this.formPesquisaRequerimento.controls['guiasPagasOuIsentas'];
    event.currentTarget.checked ? controlValue.setValue(SimNaoEnum.S) : controlValue.setValue('');
  }

  /**
   * @description altera o valor default do checkbox
   * @param event evento de change do checkbox
   */
  checkValueMeusRequerimentos(event) {
    const controlValue = this.formPesquisaRequerimento.controls['requerimentoDoResponsavel'];
    event.currentTarget.checked ? controlValue.setValue(SimNaoEnum.S) : controlValue.setValue('');
  }

  visualizarRequerimento(idRequerimento: number, tipoRequerimento: string) {
    if (idRequerimento != null) {
      if (!this.authService.isLogged()) {
        this.router.navigate([`/requerimentos/${idRequerimento}`]);
      } else {
        if (tipoRequerimento == 'APROVACAO_PARCELAMENTO_SOLO') {
          this.router.navigate([`admin/requerimento/cadastro/${idRequerimento}/formularios/`]);
        } else {
          this.router.navigate([`admin/requerimento/cadastro/${idRequerimento}/formularios-verificacao/`]);
        }
      }
    }
  }

  consultarGuias() {
    this.guiasService.selecaoGuias(1).subscribe(guias => {
      this.guias = guias;
    });
  }

}
