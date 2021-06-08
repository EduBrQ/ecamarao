import { AppStatusBadgeDirective } from "./app-status-badge.directive";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IconAnexoDirective } from "./icon-anexo.directive";
import { ClickStopPropagation } from "./stop-propagation.directive";

@NgModule({
  declarations: [
    AppStatusBadgeDirective,
    ClickStopPropagation,
    IconAnexoDirective,
  ],
  exports: [
    AppStatusBadgeDirective,
    ClickStopPropagation,
    IconAnexoDirective
  ],
  imports: [CommonModule]
})
export class SharedDirectivesModule { }
