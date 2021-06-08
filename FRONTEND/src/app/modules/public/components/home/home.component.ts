import { Component, OnInit } from '@angular/core';
import { ViveiroDTO } from '../../models/interface/viveiro-dto.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'app/shared/shared-services/validators-service.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public viveiros: ViveiroDTO[];
  formViveiro: FormGroup;
  formSubmitAttempt: boolean;

  constructor(
    private router: Router,
    private validateFormService: ValidatorsService,
    private fb: FormBuilder
  ) {
    this.viveiros = [
      {
        id: 1,
        tamanho: 1500,
        ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
        densidade: 70,
        latitude: '-7.397094',
        longitude: '-35.540758',
        laboratorio: 'AquaTec',
        proprietario: 'Erica',
        dataInicioCiclo: '15/08/2020'
      },
      {
        id: 2,
        tamanho: 1100,
        ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
        densidade: 50,
        latitude: '-7.392803',
        longitude: ' -35.542637',
        laboratorio: 'AquaTec',
        proprietario: 'Eduardo',
        dataInicioCiclo: '15/08/2020'
      }
    ]
  }

  ngOnInit(): void {
    this.criarFormulario();
  }

  criarFormulario() {
    this.formViveiro = this.fb.group({
      id: ['', []],
      volume: ['', Validators.required],
      densidade: ['', Validators.required],
      laboratorio: ['', Validators.required],
      proprietario: ['', Validators.required],
      dataInicioCiclo: ['', Validators.required],
    });
  }

  public visualizarViveiro(viveiro: ViveiroDTO) {
    this.router.navigate([`../viveiro/${viveiro.id}`]);
    localStorage.setItem('viveiro', JSON.stringify(viveiro));
  }

  isFieldValid(field: string) {
    return (!this.formViveiro.get(field).valid && this.formViveiro.get(field).touched) ||
      (this.formViveiro.get(field).untouched && this.formSubmitAttempt);
  }

  displayFieldCss(field: string) {
    return {
      'has-error': this.isFieldValid(field),
      'has-feedback': this.isFieldValid(field)
    };
  }

  adicionarViveiro() {
    this.formSubmitAttempt = true;
    if (this.formViveiro.valid) {
      this.formViveiro.reset()
      const id = this.viveiros.length + 1;
      this.formViveiro.get('id').patchValue(id);
      console.log(this.formViveiro.getRawValue());

      this.viveiros.push(this.formViveiro.getRawValue());
    } else {
      this.validateFormService.validateAllFormFields(this.formViveiro);
    }
  }
}
