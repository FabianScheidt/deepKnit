import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { Knitpaint } from '../knitpaint';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class DrawTool implements KnitpaintTool {

  public readonly name = 'Draw';
  public colorNumber = 0;
  private transform: SVGMatrix;
  private knitpaint: Knitpaint;
  private readonly unloadSubject: Subject<void> = new Subject<void>();

  constructor(private ngZone: NgZone) { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.attachDrawEvents(canvas);
  }

  transformAvailable(transform: SVGMatrix): void {
    this.transform = transform;
  }

  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaint = knitpaint;
  }

  unload(): void {
    delete this.transform;
    delete this.colorNumber;
    this.unloadSubject.next();
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
    const width = this.knitpaint.width.getValue();
    const index = KnitpaintCanvasUtils.getIndexAtCoordinates(x, y, width, this.transform.inverse());
    this.knitpaint.setColorNumber(index, this.colorNumber);
  }

}
