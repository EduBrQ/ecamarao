import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerFormularioComponent } from './container-formulario.component';

describe('ContainerFormularioComponent', () => {
  let component: ContainerFormularioComponent;
  let fixture: ComponentFixture<ContainerFormularioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerFormularioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerFormularioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
