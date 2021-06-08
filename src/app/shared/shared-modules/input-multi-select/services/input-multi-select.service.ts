import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InputMultiSelectService {

  errorEvt = new Subject<any>();
  $error = this.errorEvt.asObservable();

  constructor() { }

  atualizarErrorEvt(error: boolean) {
    this.errorEvt.next(error);
  }
}
