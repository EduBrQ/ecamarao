import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnotacoesComponent } from './anotacoes.component';

describe('AnotacoesComponent', () => {
  let component: AnotacoesComponent;
  let fixture: ComponentFixture<AnotacoesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnotacoesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnotacoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
