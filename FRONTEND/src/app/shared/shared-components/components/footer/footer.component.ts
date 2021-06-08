import { Component, OnInit } from '@angular/core';
import { AppInfo } from '@shared/models/const/info.const';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor() { }

  ngOnInit() {

  }

  retornarDiaAtual(): number {
    return new Date().getFullYear();
  }

  getVersao() {
    try {
      return AppInfo.VERSION;
    } catch (error) {
      return 'VERSION_ERROR';
    }
  }

}
