import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ph',
  templateUrl: './ph.component.html',
  styleUrls: ['./ph.component.scss']
})
export class PhComponent implements OnInit {

  public phAtual = {
    valor: 7,
    legenda: 'Neutro'
  };
  public escalasPH = [
    {
      valor: 0,
      legenda: 'Ácido'
    },
    {
      valor: 1,
      legenda: 'Ácido'
    },
    {
      valor: 2,
      legenda: 'Ácido'
    },
    {
      valor: 3,
      legenda: 'Ácido'
    },
    {
      valor: 4,
      legenda: 'Ácido'
    },
    {
      valor: 5,
      legenda: 'Ácido'
    },
    {
      valor: 6,
      legenda: 'Ácido'
    },
    {
      valor: 7,
      legenda: 'Neutro'
    },
    {
      valor: 8,
      legenda: 'Alcalino'
    },
    {
      valor: 9,
      legenda: 'Alcalino'
    },
    {
      valor: 10,
      legenda: 'Alcalino'
    },
    {
      valor: 11,
      legenda: 'Alcalino'
    },
    {
      valor: 12,
      legenda: 'Alcalino'
    },
    {
      valor: 13,
      legenda: 'Alcalino'
    },
    {
      valor: 14,
      legenda: 'Alcalino'
    },
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
