import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarViewComponent } from './toolbar-view.component';

describe('ToolbarViewComponent', () => {
  let component: ToolbarViewComponent;
  let fixture: ComponentFixture<ToolbarViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ToolbarViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
