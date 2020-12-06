import { Injectable, NgZone } from '@angular/core';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { KnitpaintTool } from '../knitpaint-tool';
import { fromEvent, merge, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class MouseTransformTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Mouse Transform Tool';
  private setTransform: (transform: SVGMatrix) => void;
  private mouseUpSubject: Subject<void> = new Subject<void>();

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, _, __, setTransform: (transform: SVGMatrix) => void): void {
    this.setTransform = setTransform;
    this.attachTransformEvents(canvas);
  }

  /**
   * Attaches event handlers to allow translating the canvas
   *
   * @param canvas
   * Canvas to attach events to
   */
  private attachTransformEvents(canvas: HTMLCanvasElement) {
    this.ngZone.runOutsideAngular(() => {
      const middleFilter = filter((e: MouseEvent) => e.which === 2);
      fromEvent(canvas, 'mousedown').pipe(takeUntil(this.unloadSubject), middleFilter).subscribe((downEvent: MouseEvent) => {
        // Store cursor and start transformation
        const startPoint = KnitpaintCanvasUtils.createSVGPoint(downEvent.pageX, downEvent.pageY);
        const startTransform = this.transform.scale(1);

        // Store cursor and replace with drag cursor
        const startCursor = canvas.style.cursor;
        canvas.style.cursor = 'grabbing';

        // Register move and up event
        const until = takeUntil(merge(this.unloadSubject, this.mouseUpSubject));
        fromEvent(document, 'mousemove').pipe(until, middleFilter).subscribe((moveEvent: MouseEvent) => {
          const deltaX = moveEvent.pageX - startPoint.x;
          const deltaY = moveEvent.pageY - startPoint.y;
          const transform = startTransform;
          const newTransform = transform.multiply(transform.inverse()).translate(deltaX, deltaY).multiply(transform);
          this.setTransform(newTransform);
        });
        fromEvent(document, 'mouseup').pipe(until, middleFilter).subscribe(() => {
          canvas.style.cursor = startCursor;
          this.mouseUpSubject.next();
        });
      });
    });
  }
}
