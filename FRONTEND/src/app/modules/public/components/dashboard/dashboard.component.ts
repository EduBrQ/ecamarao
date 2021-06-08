import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public graficoTipo = "doughnut";
  public graficoCores: Array<any> = [
    { backgroundColor: ["#28a745", "#dc3545", "#f8f9fa"] },
  ];
  public graficoTexto;

  public graficoOptions = {
    cutoutPercentage: 72,
    tooltips: { enabled: false },
  };

  constructor() { }

  ngOnInit(): void {
  }

}
