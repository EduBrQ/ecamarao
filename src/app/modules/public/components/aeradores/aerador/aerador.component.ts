import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AeradorDTO } from 'app/modules/public/models/interface/aerador-dto.model';

@Component({
  selector: 'app-aerador',
  templateUrl: './aerador.component.html',
  styleUrls: ['./aerador.component.scss']
})
export class AeradorComponent implements OnInit {

  @Input() aerador: AeradorDTO;
  @Output() eventRemoverAerador = new EventEmitter<any>();
  public loading: boolean;

  constructor() { }

  ngOnInit(): void {
  }

  public ligarDesligarAerador(aerador: AeradorDTO) {
    setTimeout(() => {
      this.loading = false;
      aerador.status = !aerador.status;
    }, 7000);
    this.loading = true;
  }

  removerAerador(aerador) {
    this.eventRemoverAerador.emit(aerador);
  }

}
