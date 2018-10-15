import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KnitpaintViewerComponent } from './knitpaint-viewer.component';

describe('KnitpaintViewerComponent', () => {
  let component: KnitpaintViewerComponent;
  let fixture: ComponentFixture<KnitpaintViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KnitpaintViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnitpaintViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
