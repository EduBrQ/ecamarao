import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OxigenioComponent } from './oxigenio.component';

describe('OxigenioComponent', () => {
  let component: OxigenioComponent;
  let fixture: ComponentFixture<OxigenioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OxigenioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OxigenioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
