import { Component, OnInit } from '@angular/core';
import { ViveiroDTO } from 'app/modules/public/models/interface/viveiro-dto.model';

@Component({
  selector: 'app-viveiro',
  templateUrl: './viveiro.component.html',
  styleUrls: ['./viveiro.component.scss']
})
export class ViveiroComponent implements OnInit {
  public viveiro: ViveiroDTO;
  flag = true;
  constructor() {
  }


  ngOnInit(): void {
    this.viveiro = JSON.parse(localStorage.getItem('viveiro'));
  }

}
