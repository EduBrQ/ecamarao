import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaViveirosComponent } from './lista-viveiros.component';

describe('ListaViveirosComponent', () => {
  let component: ListaViveirosComponent;
  let fixture: ComponentFixture<ListaViveirosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListaViveirosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaViveirosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
