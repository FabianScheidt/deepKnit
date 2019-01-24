import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from '../knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { fromEvent } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';
import { Knitpaint } from '../../knitpaint';

@Injectable()
export class DrawTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Draw';
  public colorNumber = 0;
  private setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void;

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, _, setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void): void {
    this.attachDrawEvents(canvas);
    this.setKnitpaint = setKnitpaint;
  }

  private attachDrawEvents(canvas: HTMLCanvasElement): void {
    this.ngZone.runOutsideAngular(() => {
      let isDown = false;

      // Mouse events
      fromEvent(canvas, 'mousedown').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        isDown = true;
        this.draw(event.offsetX, event.offsetY);

        fromEvent(document, 'mouseup').pipe(takeUntil(this.unloadSubject), first()).subscribe(() => {
          isDown = false;
          this.setKnitpaint(this.knitpaint, true);
        });
      });
      fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        if (isDown) {
          this.draw(event.offsetX, event.offsetY);
        }
      });

      // Touch events
      fromEvent(canvas, 'touchstart').pipe(takeUntil(this.unloadSubject)).subscribe((event: TouchEvent) => {
        if (event.touches.length === 1) {
          event.preventDefault();
          isDown = true;
          const rect = (<any>event.target).getBoundingClientRect();
          const x = event.targetTouches[0].pageX - rect.left;
          const y = event.targetTouches[0].pageY - rect.top;
          this.draw(x, y);

          fromEvent(document, 'touchend').pipe(takeUntil(this.unloadSubject), first()).subscribe(() => {
            isDown = false;
            this.setKnitpaint(this.knitpaint, true);
          });
        }

      });
      fromEvent(canvas, 'touchmove').pipe(takeUntil(this.unloadSubject)).subscribe((event: TouchEvent) => {
        if (isDown) {
          event.preventDefault();
          const rect = (<any>event.target).getBoundingClientRect();
          const x = event.targetTouches[0].pageX - rect.left;
          const y = event.targetTouches[0].pageY - rect.top;
          this.draw(x, y);
        }
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
    if (newKnitpaint) {
      this.ngZone.run(() => this.setKnitpaint(newKnitpaint, false));
    }
  }

}
