import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolOptionsComponent } from './tool-options.component';

describe('ToolOptionsComponent', () => {
  let component: ToolOptionsComponent;
  let fixture: ComponentFixture<ToolOptionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ToolOptionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
