import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarToolsComponent } from './toolbar-tools.component';

describe('ToolbarToolsComponent', () => {
  let component: ToolbarToolsComponent;
  let fixture: ComponentFixture<ToolbarToolsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ToolbarToolsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
