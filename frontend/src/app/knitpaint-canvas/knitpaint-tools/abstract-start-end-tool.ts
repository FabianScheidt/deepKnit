import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

export abstract class AbstractStartEndTool extends AbstractKnitpaintTool {

  protected startPoint: SVGPoint;
  protected endPoint: SVGPoint;

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
        this.startPoint = KnitpaintCanvasUtils.createSVGPoint(e.offsetX, e.offsetY);
        this.endPoint = KnitpaintCanvasUtils.createSVGPoint(e.offsetX, e.offsetY);
        requestRender();
      });

    fromEvent(canvas, 'mousemove')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.startPoint))
      .subscribe((e: MouseEvent) => {
        this.endPoint = KnitpaintCanvasUtils.createSVGPoint(e.offsetX, e.offsetY);
        requestRender();
      });

    fromEvent(document, 'mouseup')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.startPoint))
      .subscribe(() => {
        this.apply();
        requestRender();
        delete this.startPoint;
        delete this.endPoint;
      });
  }

  private attachTouchEvents(canvas: HTMLCanvasElement, requestRender: () => void): void {
    fromEvent(canvas, 'touchstart')
      .pipe(takeUntil(this.unloadSubject), filter((e: TouchEvent) => e.touches.length === 1))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        const boundary = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.startPoint = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
        this.endPoint = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
        requestRender();
      });

    fromEvent(canvas, 'touchmove')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.startPoint))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        const boundary = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.endPoint = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
        requestRender();
      });

    fromEvent(document, 'touchend')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.startPoint))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        this.apply();
        requestRender();
        delete this.startPoint;
        delete this.endPoint;
      });
  }

  protected apply() {}

  protected getKnitpaintRect(): [SVGPoint, SVGPoint] {
    if (!this.startPoint || !this.endPoint) {
      return null;
    }
    const start = this.startPoint.matrixTransform(this.transform.inverse());
    const end = this.endPoint.matrixTransform(this.transform.inverse());
    const startX = Math.floor(Math.max(0, Math.min(start.x, end.x)));
    const startY = Math.floor(Math.max(0, Math.min(start.y, end.y)));
    const endX = Math.ceil(Math.min(this.knitpaint.width, Math.max(start.x, end.x)));
    const endY = Math.ceil(Math.min(this.knitpaint.height, Math.max(start.y, end.y)));
    return [KnitpaintCanvasUtils.createSVGPoint(startX, startY), KnitpaintCanvasUtils.createSVGPoint(endX, endY)];
  }
}
