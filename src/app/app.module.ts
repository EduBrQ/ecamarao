import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PrivateModule } from './modules/private/private.module';
import { PublicModule } from './modules/public/public.module';
import { CoreModule } from './core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedDirectivesModule } from './shared/shared-directives/shared-directives.module';
import { ValidacaoFormularioModule } from './shared/shared-modules/validacao-formulario/validacao-formulario.module';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DataUtilService } from './shared/util/data-util.service';
import { SharedComponentsModule } from './shared/shared-components/shared-components.module';
import { ChartsModule } from 'ng2-charts';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);
@NgModule({
  declarations: [
    AppComponent
  ],
  schemas: [

  ],
  imports: [
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedDirectivesModule,
    ValidacaoFormularioModule.forRoot(),
    AppRoutingModule,
    NgxSpinnerModule,
    PublicModule,
    PrivateModule,
    CoreModule,
    SharedComponentsModule,
    ChartsModule,
    ReactiveFormsModule

  ],
  providers: [
    DataUtilService,
    {
      provide: LOCALE_ID,
      useValue: 'pt-BR'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
