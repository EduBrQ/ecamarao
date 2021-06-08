import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-temperatura',
  templateUrl: './temperatura.component.html',
  styleUrls: ['./temperatura.component.scss']
})
export class TemperaturaComponent implements OnInit {

  public phAtual = {
    valor: 36,
    legenda: 'Elevada'
  };

  constructor() { }

  ngOnInit(): void {
  }

}
