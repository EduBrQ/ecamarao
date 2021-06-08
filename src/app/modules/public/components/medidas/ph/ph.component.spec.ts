import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhComponent } from './ph.component';

describe('PhComponent', () => {
  let component: PhComponent;
  let fixture: ComponentFixture<PhComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
