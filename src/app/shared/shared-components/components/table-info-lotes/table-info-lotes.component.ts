import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-info-lotes',
  templateUrl: './table-info-lotes.component.html',
  styleUrls: ['./table-info-lotes.component.css']
})
export class TableInfoLotesComponent implements OnInit {
  @Input() titleClass = '1rem';
  @Input() titulo: string;
  @Input() loading = false;

  constructor() { }

  ngOnInit() {
  }

}
