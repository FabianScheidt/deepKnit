import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TooltipOutletComponent } from './tooltip-outlet.component';

describe('TooltipOutletComponent', () => {
  let component: TooltipOutletComponent;
  let fixture: ComponentFixture<TooltipOutletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TooltipOutletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TooltipOutletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
