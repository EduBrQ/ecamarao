import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputRadioListComponent } from './components/input-radio-list/input-radio-list.component';

@NgModule({
  declarations: [InputRadioListComponent],
  exports: [InputRadioListComponent],
  imports: [
    CommonModule
  ]
})
export class InputRadioListModule { }
