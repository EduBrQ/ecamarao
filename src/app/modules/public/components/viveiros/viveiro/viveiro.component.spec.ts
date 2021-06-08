import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViveiroComponent } from './viveiro.component';

describe('ViveiroComponent', () => {
  let component: ViveiroComponent;
  let fixture: ComponentFixture<ViveiroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViveiroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViveiroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
