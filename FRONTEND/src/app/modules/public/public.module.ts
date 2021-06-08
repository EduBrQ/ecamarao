import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { PublicRoutingModule } from './public-routing.module';
import { SharedComponentsModule } from '@shared/components/shared-components.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CamerasComponent } from './components/cameras/cameras.component';
import { PhComponent } from './components/medidas/ph/ph.component';
import { OxigenioComponent } from './components/medidas/oxigenio/oxigenio.component';
import { TemperaturaComponent } from './components/medidas/temperatura/temperatura.component';
import { RacaoComponent } from './components/racao/racao.component';
import { AeradoresComponent } from './components/aeradores/aeradores.component';
import { AeradorComponent } from './components/aeradores/aerador/aerador.component';
import { ViveiroComponent } from './components/viveiros/viveiro/viveiro.component';
import { MedicoesComponent } from './components/viveiros/viveiro/medicoes/medicoes.component';
import { ListaViveirosComponent } from './components/viveiros/lista-viveiros.component';
import { AnotacoesComponent } from './components/anotacoes/anotacoes.component';
import { FeedbacksComponent } from './components/feedbacks/feedbacks.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule, IConfig } from 'ngx-mask';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    CamerasComponent,
    PhComponent,
    OxigenioComponent,
    TemperaturaComponent,
    RacaoComponent,
    AeradoresComponent,
    AeradorComponent,
    ViveiroComponent,
    ListaViveirosComponent,
    MedicoesComponent,
    AnotacoesComponent,
    FeedbacksComponent],
  imports: [
    CommonModule,
    PublicRoutingModule,
    SharedComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    NgxMaskModule.forRoot(),
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class PublicModule { }
