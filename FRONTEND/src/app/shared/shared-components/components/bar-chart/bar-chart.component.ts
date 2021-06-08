import { Component, Input, OnInit } from '@angular/core';
import { ChartOptions, ChartType, ChartDataSets, ChartLayoutOptions } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})

export class BarChartComponent implements OnInit {

  @Input() barChartLabels: Label[];
  @Input() barChartData: ChartDataSets[];

  layout: ChartLayoutOptions = {
  };

  barChartOptions: ChartOptions = {
    responsive: true,
    aspectRatio: 3.6
  };

  barChartType: ChartType = 'bar';
  barChartLegend = true;
  barChartPlugins = [];

  ngOnInit(): void {
  }

}
