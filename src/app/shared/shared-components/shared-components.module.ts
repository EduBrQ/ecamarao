import { ContainerPadraoComponent } from "./components/container-padrao/container-padrao.component";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { SharedDirectivesModule } from "@shared/directives/shared-directives.module";
import { ToastrModule } from "ngx-toastr";
import { BreadcrumbComponent } from "./components/breadcrumb/breadcrumb.component";
import { ContainerFormularioComponent } from "./components/container-formulario/container-formulario.component";
import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";
import { InputListaCheckboxComponent } from "./components/input-lista-checkbox/input-lista-checkbox/input-lista-checkbox.component";
import { InputListaRadioComponent } from "./components/input-lista-radio/input-lista-radio.component";
import { InputContainerComponent } from "./components/input/input-container.component";
import { ListaVaziaComponent } from "./components/lista-vazia/lista-vazia.component";
import { PopoverComponent } from "./components/popover/popover.component";
import { ChartsModule } from 'ng2-charts';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { BubbleChartComponent } from './components/bubble-chart/bubble-chart.component';
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { RadarChartComponent } from './components/radar-chart/radar-chart.component';
import { DoughnutChartComponent } from './components/doughnut-chart/doughnut-chart.component';
import { FieldErrorDisplayComponent } from './components/field-error-display/field-error-display.component';
@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    InputListaRadioComponent,
    ContainerFormularioComponent,
    ContainerPadraoComponent,
    InputContainerComponent,
    InputListaCheckboxComponent,
    BreadcrumbComponent,
    ListaVaziaComponent,
    PopoverComponent,
    LineChartComponent,
    BarChartComponent,
    BubbleChartComponent,
    PieChartComponent,
    RadarChartComponent,
    DoughnutChartComponent,
    FieldErrorDisplayComponent,
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    InputListaRadioComponent,
    ContainerFormularioComponent,
    ContainerPadraoComponent,
    InputContainerComponent,
    InputListaCheckboxComponent,
    BreadcrumbComponent,
    ListaVaziaComponent,
    PopoverComponent,
    LineChartComponent,
    BarChartComponent,
    BubbleChartComponent,
    PieChartComponent,
    RadarChartComponent,
    DoughnutChartComponent,
    FieldErrorDisplayComponent
  ],
  entryComponents: [
  ],
  imports: [
    CommonModule,
    ToastrModule.forRoot({
      preventDuplicates: true,
      timeOut: 3000,
      positionClass: "toast-top-right",
    }),
    RouterModule,
    ReactiveFormsModule,
    SharedDirectivesModule,
    FormsModule,
    ChartsModule
  ],
})
export class SharedComponentsModule { }
