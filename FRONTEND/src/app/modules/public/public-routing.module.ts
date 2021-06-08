import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CamerasComponent } from './components/cameras/cameras.component';
import { RacaoComponent } from './components/racao/racao.component';
import { AeradoresComponent } from './components/aeradores/aeradores.component';
import { ViveiroComponent } from './components/viveiros/viveiro/viveiro.component';
import { AnotacoesComponent } from './components/anotacoes/anotacoes.component';
import { FeedbacksComponent } from './components/feedbacks/feedbacks.component';


const routes: Routes = [
  {
    path: 'home-page',
    component: HomeComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'viveiro/:id',
    component: ViveiroComponent,
    children: [
      { path: 'racao', component: RacaoComponent },
      { path: 'aeradores', component: AeradoresComponent },
      { path: 'cameras', component: CamerasComponent },
      { path: 'anotacoes', component: AnotacoesComponent },
      { path: 'feebacks', component: FeedbacksComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
