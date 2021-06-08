import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

import { StatusRequerimentoEnumBadge } from './../shared-models/enum/status-requerimento.enum';
import { StatusRequerimentoEnum } from '@shared/models/enum/status-requerimento.enum';
@Directive({
    selector: '[appStatusBadge]'
})
export class AppStatusBadgeDirective implements OnChanges {
    @Input('appStatusBadge') situacaoGuiaEnum: StatusRequerimentoEnum;

    constructor(private elementRef: ElementRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['situacaoGuiaEnum'].previousValue) {
            this.elementRef.nativeElement.classList.remove('badge', `badge-${StatusRequerimentoEnumBadge[changes['situacaoGuiaEnum'].previousValue] || 'secondary'}`);
        }

        if (this.situacaoGuiaEnum) {
            this.elementRef.nativeElement.classList.add('badge', `badge-${StatusRequerimentoEnumBadge[this.situacaoGuiaEnum] || 'secondary'}`);
        }
    }
}
