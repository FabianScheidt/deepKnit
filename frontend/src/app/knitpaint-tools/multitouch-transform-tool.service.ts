import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MultitouchTransformTool implements KnitpaintTool {

  public readonly name = 'Multitouch Transform Tool';
  private transform: SVGMatrix;
  private readonly unloadSubject: Subject<void> = new Subject<void>();
  private setTransform: (transform: SVGMatrix) => void;

  // Helper element to create SVGMatrix and SVGPoint
  private readonly someSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  constructor(private ngZone: NgZone) { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.setTransform = setTransform;
    this.attachTransformEvents(canvas);
  }

  transformAvailable(transform: SVGMatrix): void {
    this.transform = transform;
  }

  unload(): void {
    this.unloadSubject.next();
  }

  /**
   * Helper method to create an SVGPoint
   *
   * @param x
   * @param y
   */
  private createPoint(x: number, y: number): SVGPoint {
    const point = this.someSVG.createSVGPoint();
    point.x = x;
    point.y = y;
    return point;
  }

  /**
   * Attaches event handlers to allow scaling and translating the canvas
   *
   * @param canvas
   * Canvas to attach events to
   */
  private attachTransformEvents(canvas: HTMLCanvasElement) {
    this.ngZone.runOutsideAngular(() => {
      // Define methods to translate and scale based on canvas coordinates
      const doTranslate = (transform: SVGMatrix, x: number, y: number): SVGMatrix => {
        const scale = Math.sqrt(transform.a * transform.a + transform.c * transform.c);
        return transform.scale(1 / scale).translate(x, y).scale(scale);
      };
      const doScale = (transform: SVGMatrix, scale: number): SVGMatrix => {
        const scaleCenter = mousePoint.matrixTransform(transform.inverse());
        return transform.translate(scaleCenter.x, scaleCenter.y).scale(scale).translate(-scaleCenter.x, -scaleCenter.y);
      };

      // Track the mouse as origin for scaling
      let mousePoint: SVGPoint;
      fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((e: MouseEvent) => {
        mousePoint = this.createPoint(e.offsetX, e.offsetY);
      });

      // Track wheel events for translating and zooming
      fromEvent(canvas, 'wheel').pipe(takeUntil(this.unloadSubject)).subscribe((e: MouseWheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey) {
          const t = this.transform;
          const currentScale = Math.sqrt(t.a * t.a + t.c * t.c);
          const scale = Math.abs((currentScale - e.deltaY * 0.1) / currentScale);
          this.setTransform(doScale(this.transform, scale));
        } else {
          this.setTransform(doTranslate(this.transform, -e.deltaX * 2, e.deltaY * 2));
        }
      });

      // Track gestures for translating and zooming in browsers like Safari
      let gestureStartPoint: SVGPoint;
      let gestureStartTransform: SVGMatrix;

      fromEvent(canvas, 'gesturestart').pipe(takeUntil(this.unloadSubject)).subscribe((e: any) => {
        e.preventDefault();
        gestureStartPoint = this.createPoint(e.pageX, e.pageY);
        gestureStartTransform = this.transform.scale(1);
      });

      fromEvent(canvas, 'gesturechange').pipe(takeUntil(this.unloadSubject)).subscribe((e: any) => {
        e.preventDefault();
        let transform = doTranslate(gestureStartTransform, e.pageX - gestureStartPoint.x, e.pageY - gestureStartPoint.y);
        transform = doScale(transform, e.scale);
        this.setTransform(transform);
      });

      fromEvent(canvas, 'gestureend').pipe(takeUntil(this.unloadSubject)).subscribe((e: any) => {
        e.preventDefault();
      });
    });
  }
}
