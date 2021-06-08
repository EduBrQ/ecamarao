import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-lista-vazia',
  templateUrl: './lista-vazia.component.html',
  styleUrls: ['./lista-vazia.component.css']
})
export class ListaVaziaComponent implements OnInit {

  @Input() mensagem: string;

  constructor() { }

  ngOnInit() {
  }

}
