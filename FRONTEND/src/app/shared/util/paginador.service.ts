import { PropriedadesPagina } from './../shared-models/interface/propriedades-pagina.model';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginadorService {

  getPaginador(totalItems: number, paginaAtual: number = 1, tamanhoPagina: number = 10) {

      const totalPaginas = Math.ceil(totalItems / tamanhoPagina);

      if (paginaAtual < 1) {
          paginaAtual = 1;
      } else if (paginaAtual > totalPaginas) {
          paginaAtual = totalPaginas;
      }

      const indexInicial = (paginaAtual - 1) * tamanhoPagina;
      const indexFinal = Math.min(indexInicial + tamanhoPagina - 1, totalItems - 1);

      const propriedadesPagina: PropriedadesPagina = {
        indexInicial,
        indexFinal,
        totalItens: totalItems,
        totalPaginas: totalPaginas,
      };

      return propriedadesPagina;
  }

}

