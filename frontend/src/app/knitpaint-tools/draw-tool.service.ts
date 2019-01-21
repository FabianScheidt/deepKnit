import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';
import { Knitpaint } from '../knitpaint';

@Injectable({
  providedIn: 'root'
})
export class DrawTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Draw';
  public colorNumber = 0;
  private setKnitpaint: (knitpaint: Knitpaint) => void;

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, _, setKnitpaint: (knitpaint: Knitpaint) => void): void {
    this.attachDrawEvents(canvas);
    this.setKnitpaint = setKnitpaint;
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
    const index = KnitpaintCanvasUtils.getIndexAtCoordinates(x, y, this.knitpaint.width, this.transform.inverse());
    const newKnitpaint = this.knitpaint.setColorNumber(index, this.colorNumber);
    this.ngZone.run(() => this.setKnitpaint(newKnitpaint));
  }

}
