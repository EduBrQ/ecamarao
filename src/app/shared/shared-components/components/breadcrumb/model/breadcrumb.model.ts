import { Params } from '@angular/router';

export interface BreadCrumbModel {
    titulo: string;
    link: string;
    params?: Params;
}
