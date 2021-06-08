import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InputContainerComponent } from './components/input-container/input-container.component';

@NgModule({
  declarations: [
    InputContainerComponent
  ],
  exports: [
    InputContainerComponent, CommonModule
  ],
  imports: [
    CommonModule
  ]
})
export class InputContainerModule { }
