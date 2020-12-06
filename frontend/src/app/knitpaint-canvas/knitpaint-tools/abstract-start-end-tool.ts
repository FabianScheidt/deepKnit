import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

export abstract class AbstractStartEndTool extends AbstractKnitpaintTool {

  protected startPoint: SVGPoint;
  protected endPoint: SVGPoint;
  private down = false;
  private moved = false;

  protected constructor() {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void, _?, __?): void {
    this.attachMouseEvents(canvas, requestRender);
    this.attachTouchEvents(canvas, requestRender);
  }

  unload(): void {
    delete this.startPoint;
    delete this.endPoint;
    super.unload();
  }

  private attachMouseEvents(canvas: HTMLCanvasElement, requestRender: () => void): void {
    fromEvent(canvas, 'mousedown')
      .pipe(takeUntil(this.unloadSubject), filter((e: MouseEvent) => e.button === 0))
      .subscribe((e: MouseEvent) => {
        this.startPoint = KnitpaintCanvasUtils.createTransformedSVGPoint(e.offsetX, e.offsetY, this.transform.inverse());
        this.endPoint = KnitpaintCanvasUtils.createTransformedSVGPoint(e.offsetX, e.offsetY, this.transform.inverse());
        this.down = true;
      });

    fromEvent(canvas, 'mousemove')
      .pipe(takeUntil(this.unloadSubject), filter(() => this.down))
      .subscribe((e: MouseEvent) => {
        this.endPoint = KnitpaintCanvasUtils.createTransformedSVGPoint(e.offsetX, e.offsetY, this.transform.inverse());
        this.moved = true;
        requestRender();
      });

    fromEvent(document, 'mouseup')
      .pipe(takeUntil(this.unloadSubject), filter(() => this.down))
      .subscribe(() => {
        this.down = false;
        if (!this.moved) {
          delete this.startPoint;
          delete this.endPoint;
        }
        this.apply(requestRender);
        this.moved = false;
        requestRender();
      });
  }

  private attachTouchEvents(canvas: HTMLCanvasElement, requestRender: () => void): void {
    fromEvent(canvas, 'touchstart')
      .pipe(takeUntil(this.unloadSubject), filter((e: TouchEvent) => e.touches.length === 1))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        const boundary = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.startPoint =
          KnitpaintCanvasUtils.createTransformedSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top, this.transform.inverse());
        this.endPoint =
          KnitpaintCanvasUtils.createTransformedSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top, this.transform.inverse());
        this.down = true;
      });

    fromEvent(canvas, 'touchmove')
      .pipe(takeUntil(this.unloadSubject), filter(() => this.down))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        const boundary = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.endPoint =
          KnitpaintCanvasUtils.createTransformedSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top, this.transform.inverse());
        this.moved = true;
        requestRender();
      });

    fromEvent(document, 'touchend')
      .pipe(takeUntil(this.unloadSubject), filter(() => this.down))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        this.down = false;
        if (!this.moved) {
          delete this.startPoint;
          delete this.endPoint;
        }
        this.apply(requestRender);
        this.moved = false;
        requestRender();
      });
  }

  protected apply(requestRender: () => void) {
    delete this.startPoint;
    delete this.endPoint;
  }

  protected getKnitpaintRect(): [SVGPoint, SVGPoint] {
    if (!this.startPoint || !this.endPoint) {
      return null;
    }
    const start = this.startPoint;
    const end = this.endPoint;
    const startX = Math.floor(Math.max(0, Math.min(start.x, end.x)));
    const startY = Math.floor(Math.max(0, Math.min(start.y, end.y)));
    const endX = Math.ceil(Math.min(this.knitpaint.width, Math.max(start.x, end.x)));
    const endY = Math.ceil(Math.min(this.knitpaint.height, Math.max(start.y, end.y)));
    return [KnitpaintCanvasUtils.createSVGPoint(startX, startY), KnitpaintCanvasUtils.createSVGPoint(endX, endY)];
  }
}
