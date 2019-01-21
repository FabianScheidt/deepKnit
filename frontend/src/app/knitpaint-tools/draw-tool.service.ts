import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class DrawTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Draw';
  public colorNumber = 0;

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.attachDrawEvents(canvas);
  }

  private attachDrawEvents(canvas: HTMLCanvasElement): void {
    this.ngZone.runOutsideAngular(() => {
      let isDown = false;

      fromEvent(canvas, 'mousedown').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        isDown = true;
        this.draw(event.offsetX, event.offsetY);
      });
      fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        if (isDown) {
          this.draw(event.offsetX, event.offsetY);
        }
      });
      fromEvent(document, 'mouseup').pipe(takeUntil(this.unloadSubject)).subscribe(() => {
        isDown = false;
      });
    });
  }

  /**
   * Draws the current color number to the provided canvas location
   *
   * @param x
   * @param y
   */
  private draw(x: number, y: number): void {
    const index = KnitpaintCanvasUtils.getIndexAtCoordinates(x, y, this.knitpaintWidth, this.transform.inverse());
    this.knitpaint.setColorNumber(index, this.colorNumber);
  }

}
