import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ValidatorsService } from 'app/shared/shared-services/validators-service.service';

@Component({
  selector: 'app-anotacoes',
  templateUrl: './anotacoes.component.html',
  styleUrls: ['./anotacoes.component.scss']
})
export class AnotacoesComponent implements OnInit {
  medicoes: { id: number; data: Date; oxigenio: number; ph: number; temperatura: number; alcalinidade: number; dureza: number; transparencia: number; }[];

  formMedicoes: FormGroup;
  formSubmitAttempt = false;
  constructor(
    private fb: FormBuilder,
    private validateFormService: ValidatorsService) { }

  ngOnInit(): void {
    this.medicoes = [
      {
        id: 1,
        data: new Date(1614611114),
        oxigenio: 22,
        ph: 22,
        temperatura: 22,
        alcalinidade: 22,
        dureza: 22,
        transparencia: 22,
      },
      {
        id: 1,
        data: new Date(1614611114),
        oxigenio: 22,
        ph: 22,
        temperatura: 22,
        alcalinidade: 22,
        dureza: 22,
        transparencia: 22,
      },
      {
        id: 1,
        data: new Date(1614611114),
        oxigenio: 22,
        ph: 22,
        temperatura: 22,
        alcalinidade: 22,
        dureza: 22,
        transparencia: 22,
      },
      {
        id: 1,
        data: new Date(1614611114),
        oxigenio: 22,
        ph: 22,
        temperatura: 22,
        alcalinidade: 22,
        dureza: 22,
        transparencia: 22,
      },
      {
        id: 1,
        data: new Date(1614611114),
        oxigenio: 22,
        ph: 22,
        temperatura: 22,
        alcalinidade: 22,
        dureza: 22,
        transparencia: 22,
      },
    ];

    this.criarFormulario();
  }

  criarFormulario() {
    this.formMedicoes = this.fb.group({
      id: [],
      data: [],
      oxigenio: [],
      ph: [],
      temperatura: [],
      alcalinidade: [],
      dureza: [],
      transparencia: [],
    });
  }

  removerColeta(id) {
    this.medicoes.splice(this.medicoes.findIndex(item => id === item.id), 1);
  }

  isFieldValid(field: string) {
    return (!this.formMedicoes.get(field).valid && this.formMedicoes.get(field).touched) ||
      (this.formMedicoes.get(field).untouched && this.formSubmitAttempt);
  }

  displayFieldCss(field: string) {
    return {
      'has-error': this.isFieldValid(field),
      'has-feedback': this.isFieldValid(field)
    };
  }

  adicionarMedicoes() {
    this.formSubmitAttempt = true;
    if (this.formMedicoes.valid) {
      this.formMedicoes.get('data').patchValue(this.formMedicoes.get('data').value);
      this.medicoes.push(this.formMedicoes.getRawValue());
    } else {
      this.validateFormService.validateAllFormFields(this.formMedicoes);
    }
  }

}
