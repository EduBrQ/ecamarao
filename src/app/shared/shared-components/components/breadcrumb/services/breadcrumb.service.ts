import { Injectable } from '@angular/core';
import { BreadcrumbObserver } from './breadcrumb.observer';

@Injectable()
export class BreadcrumbService {

    constructor(private breadCrumbObs: BreadcrumbObserver) {

    }

    listarRotas() {
        this.breadCrumbObs.listarRotas();
    }
}
