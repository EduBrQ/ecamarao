import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { ValidacaoFormularioService } from './services/validacao-formulario.service';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    exports: []
})
export class ValidacaoFormularioModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: ValidacaoFormularioModule,
            providers: [ValidacaoFormularioService]
        };
    }
}
