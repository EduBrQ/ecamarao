import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-oxigenio',
  templateUrl: './oxigenio.component.html',
  styleUrls: ['./oxigenio.component.scss']
})
export class OxigenioComponent implements OnInit {

  public phAtual = {
    valor: 22,
    legenda: 'Ideal'
  };

  constructor() { }

  ngOnInit(): void {
  }

}
