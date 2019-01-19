import { Injectable, NgZone } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { KnitpaintTool } from './knitpaint-tool';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KeyboardTransformTool implements KnitpaintTool {

  public readonly name = 'Keyboard Transform Tool';
  private canvas: HTMLCanvasElement;
  private transform: SVGMatrix;
  private readonly unloadSubject: Subject<void> = new Subject<void>();
  private setTransform: (transform: SVGMatrix) => void;

  private originalTransform: SVGMatrix;
  private dstScale: number;

  // Helper element to create SVGMatrix and SVGPoint
  private readonly someSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  constructor(private ngZone: NgZone) { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.canvas = canvas;
    this.setTransform = setTransform;
    this.attachTransformEvents();
  }

  transformAvailable(transform: SVGMatrix): void {
    this.transform = transform;
  }

  unload(): void {
    this.unloadSubject.next();
  }

  /**
   * Attaches event handlers to allow scaling the canvas
   */
  private attachTransformEvents() {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'keydown').pipe(takeUntil(this.unloadSubject)).subscribe((e: KeyboardEvent) => {
        // ctrl + or ⌘ +
        if (e.keyCode === 187 && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.scaleAroundCenter(2);
        }
        // ctrl - or ⌘ -
        if (e.keyCode === 189 && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.scaleAroundCenter(0.5);
        }
      });
    });
  }

  /**
   * Scales around the center of the canvas with some animation
   *
   * @param scale
   */
  private scaleAroundCenter(scale: number) {
    // Calculate the canvas center in knitpaint coordinates
    let center = this.someSVG.createSVGPoint();
    center.x = this.canvas.offsetWidth / 2;
    center.y = this.canvas.offsetHeight / 2;
    center = center.matrixTransform(this.transform.inverse());

    // Complete previous transform if it exists
    if (this.originalTransform && this.dstScale) {
      this.setTransform(this.scaleAroundPoint(this.originalTransform, this.dstScale, center));
    }

    // Keep a copy of the original transform and the destination scale
    this.originalTransform = this.transform.scale(1);
    this.dstScale = scale;

    // Now animate the zoom
    const animationDuration = 150;
    let start = null;
    const animationStep = (time) => {
      start = start || time;
      const relativeTime = time - start;
      const progress = relativeTime / animationDuration;
      let nextScale = Math.pow(scale, progress);
      nextScale = scale > 1 ? Math.min(nextScale, scale) : Math.max(nextScale, scale);
      this.setTransform(this.scaleAroundPoint(this.originalTransform, nextScale, center));
      if (relativeTime < animationDuration) {
        window.requestAnimationFrame(animationStep);
      }
    };
    window.requestAnimationFrame(animationStep);
  }

  private scaleAroundPoint(transform: SVGMatrix, scale: number, point: SVGPoint) {
    return transform.translate(point.x, point.y).scale(scale).translate(-point.x, -point.y);
  }
}
