import { Component, Input, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { MultiDataSet, Label } from 'ng2-charts';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.component.scss']
})

export class DoughnutChartComponent implements OnInit {

  @Input() medicao: string;
  @Input() valor: number;

  doughnutChartLabels: Label[] = [];
  doughnutChartData: MultiDataSet = [[]];
  doughnutChartType: ChartType = 'doughnut';

  ngOnInit() {
    this.doughnutChartLabels.push(this.medicao, '')
    this.doughnutChartData[0].push(this.valor, 100 - this.valor);
  }
}
