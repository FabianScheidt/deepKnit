import { KnitpaintCanvasModule } from './knitpaint-canvas.module';

describe('KnitpaintCanvasModule', () => {
  let knitpaintCanvasModule: KnitpaintCanvasModule;

  beforeEach(() => {
    knitpaintCanvasModule = new KnitpaintCanvasModule();
  });

  it('should create an instance', () => {
    expect(knitpaintCanvasModule).toBeTruthy();
  });
});
