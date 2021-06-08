import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-feedbacks',
  templateUrl: './feedbacks.component.html',
  styleUrls: ['./feedbacks.component.scss']
})
export class FeedbacksComponent implements OnInit {
  feedbacks: { id: number; medida: string; manejo?: string; condicao: string; descricao: string; }[];

  constructor() { }

  ngOnInit(): void {
    this.feedbacks = [
      {
        id: 1,
        medida: 'pH',
        condicao: 'Muito Alto',
        manejo: 'Para melhorar essa condição, é indicado o uso de calcario no viveiro',
        descricao: 'O pH está um pouco acima do ideal'
      },
      {
        id: 2,
        medida: 'Transparência',
        condicao: 'Baixo',
        manejo: 'Para melhorar essa condição, é indicado o uso de calcario no viveiro',
        descricao: 'A água está com uma transparência muito abaixo do ideal'
      },
      {
        id: 3,
        medida: 'Oxigênio',
        condicao: 'Muito Baixo',
        manejo: 'Para melhorar essa condição, é indicado o uso de calcario no viveiro',
        descricao: 'O nível de oxigênio na água está muito abaixo do ideal'
      },
    ];
  }

}
