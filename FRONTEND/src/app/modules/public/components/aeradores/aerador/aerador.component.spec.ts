import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AeradorComponent } from './aerador.component';

describe('AeradorComponent', () => {
  let component: AeradorComponent;
  let fixture: ComponentFixture<AeradorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AeradorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AeradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
