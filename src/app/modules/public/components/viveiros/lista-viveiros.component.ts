import { Component, OnInit } from '@angular/core';
import { ViveiroDTO } from '../../models/interface/viveiro-dto.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-viveiros',
  templateUrl: './lista-viveiros.component.html',
  styleUrls: ['./lista-viveiros.component.scss']
})
export class ListaViveirosComponent implements OnInit {
  public viveiros: ViveiroDTO[];

  constructor(
    private router: Router
  ) {
    this.viveiros = [
      {
        id: 1,
        tamanho: 1500,
        ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
        densidade: 70000,
        latitude: '',
        longitude: '',
        laboratorio: 'AquaTec',
        proprietario: 'Erica',
        dataInicioCiclo: '15/08/2020'
      },
      {
        id: 2,
        tamanho: 1100,
        ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
        densidade: 50000,
        latitude: '',
        longitude: '',
        laboratorio: 'AquaTec',
        proprietario: 'Dudu',
        dataInicioCiclo: '15/08/2020'
      }
    ]
  }

  ngOnInit(): void {
  }

  public visualizarViveiro(viveiroID) {
    this.router.navigate([`../viveiro/${viveiroID}`]);
  }

  public addViveiro() {
    this.viveiros.push({
      id: this.viveiros.length + 1,
      tamanho: 2200,
      ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
      densidade: 100000,
      latitude: '',
      longitude: '',
      laboratorio: 'AquaTec',
      proprietario: 'Eraldo',
      dataInicioCiclo: '15/08/2020'
    })

  }

}
