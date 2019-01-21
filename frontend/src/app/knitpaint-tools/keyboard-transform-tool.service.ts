import { Injectable, NgZone } from '@angular/core';
import { fromEvent } from 'rxjs';
import { KnitpaintTool } from './knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class KeyboardTransformTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Keyboard Transform Tool';
  private canvas: HTMLCanvasElement;
  private setTransform: (transform: SVGMatrix) => void;

  // Keep track of some values for animation
  private startTime;
  private originalTransform: SVGMatrix;
  private dstScale: number;
  private dstCenter: SVGPoint;

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.canvas = canvas;
    this.setTransform = setTransform;
    this.attachTransformEvents();
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
        // ctr 0 or ⌘ 0
        if (e.keyCode === 48 && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          const canvasWidth = this.canvas.offsetWidth;
          const canvasHeight = this.canvas.offsetHeight;
          this.setTransform(
            KnitpaintCanvasUtils.createResetSVGMatrix(canvasWidth, canvasHeight, this.knitpaintWidth, this.knitpaintHeight));
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
    // Complete previous transform if it exists
    this.scaleToDst(this.dstScale);

    // Set new destination
    this.dstScale = scale;
    this.originalTransform = this.transform.scale(1);
    this.startTime = null;

    // Calculate the canvas center in knitpaint coordinates
    const canvasCenterX = this.canvas.offsetWidth / 2;
    const canvasCenterY = this.canvas.offsetHeight / 2;
    this.dstCenter = KnitpaintCanvasUtils.createTransformedSVGPoint(canvasCenterX, canvasCenterY, this.transform.inverse());

    // Now animate the zoom
    const animationDuration = 150;
    const animationStep = (time) => {
      this.startTime = this.startTime || time;
      const relativeTime = time - this.startTime;
      const progress = relativeTime / animationDuration;
      let nextScale = Math.pow(this.dstScale, progress);
      nextScale = this.dstScale > 1 ? Math.min(nextScale, this.dstScale) : Math.max(nextScale, this.dstScale);
      this.scaleToDst(nextScale);
      if (relativeTime < animationDuration) {
        window.requestAnimationFrame(animationStep);
      } else {
        delete this.originalTransform;
        delete this.dstScale;
        delete this.dstCenter;
      }
    };
    window.requestAnimationFrame(animationStep);
  }

  private scaleToDst(scale: number) {
    if (this.originalTransform && this.dstScale && this.dstCenter) {
      this.setTransform(KnitpaintCanvasUtils.scaleAroundPoint(this.originalTransform, scale, this.dstCenter));
    }
  }
}
