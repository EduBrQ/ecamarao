import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AeradoresComponent } from './aeradores.component';

describe('AeradoresComponent', () => {
  let component: AeradoresComponent;
  let fixture: ComponentFixture<AeradoresComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AeradoresComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AeradoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
