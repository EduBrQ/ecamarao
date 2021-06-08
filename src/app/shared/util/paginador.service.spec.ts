import { TestBed } from '@angular/core/testing';

import { PaginadorService } from './paginador.service';

describe('PaginadorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PaginadorService = TestBed.get(PaginadorService);
    expect(service).toBeTruthy();
  });
});
