import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KnitpaintCanvasComponent } from './knitpaint-canvas.component';

describe('KnitpaintCanvasComponent', () => {
  let component: KnitpaintCanvasComponent;
  let fixture: ComponentFixture<KnitpaintCanvasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KnitpaintCanvasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnitpaintCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
