import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasTesterComponent } from './canvas-tester.component';

describe('CanvasTesterComponent', () => {
  let component: CanvasTesterComponent;
  let fixture: ComponentFixture<CanvasTesterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CanvasTesterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasTesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
