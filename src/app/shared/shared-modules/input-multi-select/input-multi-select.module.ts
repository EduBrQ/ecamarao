import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputMultiSelectComponent } from './components/input-multi-select/input-multi-select.component';

@NgModule({
  declarations: [InputMultiSelectComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [InputMultiSelectComponent]
})
export class InputMultiSelectModule { }
