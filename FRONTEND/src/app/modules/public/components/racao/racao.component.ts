import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'app/shared/shared-services/validators-service.service';
import { ColetaRacao } from './models/racao.model';

@Component({
  selector: 'app-racao',
  templateUrl: './racao.component.html',
  styleUrls: ['./racao.component.scss']
})
export class RacaoComponent implements OnInit {
  viveiroID: any;
  racao: Array<ColetaRacao>;
  formRacao: FormGroup;
  formSubmitAttempt: boolean;
  racaoTotal = 0;
  gastoRacao = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private validateFormService: ValidatorsService
  ) { }

  ngOnInit(): void {
    this.criarFormulario();
    this.viveiroID = this.activatedRoute.snapshot.parent.params.id;
    this.racao = [
      {
        id: 1,
        data: new Date('2020-12-12'),
        qntManha: 5,
        qntTarde: 5
      },
      {
        id: 2,
        data: new Date('2020-12-12'),
        qntManha: 5,
        qntTarde: 5
      },
      {
        id: 3,
        data: new Date('2020-12-12'),
        qntManha: 7,
        qntTarde: 7
      },
      {
        id: 4,
        data: new Date('2020-12-12'),
        qntManha: 7,
        qntTarde: 7
      },
      {
        id: 5,
        data: new Date('2020-12-12'),
        qntManha: 8,
        qntTarde: 8
      },
      {
        id: 6,
        data: new Date('2020-12-12'),
        qntManha: 8,
        qntTarde: 8
      },
    ];

    this.calcularRacaoTotal();
  }

  criarFormulario() {
    this.formRacao = this.fb.group({
      data: ['', Validators.required],
      qntManha: ['', Validators.required],
      qntTarde: ['', Validators.required],
    });
  }

  isFieldValid(field: string) {
    return (!this.formRacao.get(field).valid && this.formRacao.get(field).touched) ||
      (this.formRacao.get(field).untouched && this.formSubmitAttempt);
  }

  displayFieldCss(field: string) {
    return {
      'has-error': this.isFieldValid(field),
      'has-feedback': this.isFieldValid(field)
    };
  }

  adicionarRacao() {
    this.formSubmitAttempt = true;
    if (this.formRacao.valid) {
      this.formRacao.get('data').patchValue(this.formRacao.get('data').value);
      this.racao.push(this.formRacao.getRawValue());
      this.calcularRacaoTotal();
    } else {
      this.validateFormService.validateAllFormFields(this.formRacao);
    }
  }

  calcularRacaoTotal() {
    this.racaoTotal = 0;
    this.racao.forEach(element => {
      this.racaoTotal = this.racaoTotal + element.qntManha + element.qntTarde;
    });
    this.gastoRacao = this.racaoTotal * 3;
  }

  removerColeta(id) {
    this.racao.splice(this.racao.findIndex(item => id === item.id), 1);
    this.calcularRacaoTotal();
  }

}
