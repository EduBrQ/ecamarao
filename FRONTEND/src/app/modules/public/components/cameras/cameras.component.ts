import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ValidatorsService } from 'app/shared/shared-services/validators-service.service';

@Component({
  selector: 'app-cameras',
  templateUrl: './cameras.component.html',
  styleUrls: ['./cameras.component.scss']
})
export class CamerasComponent implements OnInit {
  viveiroID: any;
  cameras: { id: number; ipCamera: string; }[];
  formSubmitAttempt = false;
  formCamera: FormGroup;

  constructor(private activatedRoute: ActivatedRoute, private fb: FormBuilder, private validateFormService: ValidatorsService) { }

  ngOnInit(): void {
    this.viveiroID = this.activatedRoute.snapshot.parent.params.id;

    this.cameras = [
      {
        id: 1,
        ipCamera: 'http://166.165.35.32:80/mjpg/video.mjpg'
      },
      {
        id: 2,
        ipCamera: 'http://213.34.225.97:8080/mjpg/video.mjpg'
      }
    ]
    this.criarFormulario();
  }

  criarFormulario() {
    this.formCamera = this.fb.group({
      id: [],
      ipCamera: ['', Validators.required],
    });
  }
  adicionarCamera() {
    this.formSubmitAttempt = true;
    if (this.formCamera.valid) {
      const id = this.cameras.length + 1;
      this.formCamera.get('id').patchValue(id);
      console.log(this.formCamera.getRawValue());

      this.cameras.push(this.formCamera.getRawValue());
    } else {
      this.validateFormService.validateAllFormFields(this.formCamera);
    }
  }

  removerCamera(camera) {
    const index = this.cameras.indexOf(camera);
    this.cameras.splice(index, 1);
  }

  isFieldValid(field: string) {
    return (!this.formCamera.get(field).valid && this.formCamera.get(field).touched) ||
      (this.formCamera.get(field).untouched && this.formSubmitAttempt);
  }

  displayFieldCss(field: string) {
    return {
      'has-error': this.isFieldValid(field),
      'has-feedback': this.isFieldValid(field)
    };
  }
}
