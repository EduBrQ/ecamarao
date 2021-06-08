import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RacaoComponent } from './racao.component';

describe('RacaoComponent', () => {
  let component: RacaoComponent;
  let fixture: ComponentFixture<RacaoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RacaoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
