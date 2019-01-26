import { Injectable } from '@angular/core';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { KnitpaintTool } from '../knitpaint-tool';
import { Knitpaint } from '../../knitpaint';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

@Injectable()
export class RectangleTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Rectangle Tool';
  public colorNumber = 0;
  private rectStart: SVGPoint;
  private rectEnd: SVGPoint;
  private setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void;

  constructor() {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void,
       setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void, _): void {
    this.setKnitpaint = setKnitpaint;
    this.attachMouseEvents(canvas, requestRender);
    this.attachTouchEvents(canvas, requestRender);
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    if (!this.rectStart || !this.rectEnd) {
      return;
    }

    // Snap the coordinates to the grid
    let start, end;
    [start, end] = this.getKnitpaintRect();
    start = start.matrixTransform(this.transform);
    end = end.matrixTransform(this.transform);

    // Draw the rectangle
    ctx.save();
    ctx.fillStyle = Knitpaint.getColorString(this.colorNumber);
    ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.restore();
  }

  unload(): void {
    delete this.rectStart;
    delete this.rectEnd;
    delete this.setKnitpaint;
    super.unload();
  }

  private attachMouseEvents(canvas: HTMLCanvasElement, requestRender: () => void): void {
    fromEvent(canvas, 'mousedown')
      .pipe(takeUntil(this.unloadSubject), filter((e: MouseEvent) => e.button === 0))
      .subscribe((e: MouseEvent) => {
        this.rectStart = KnitpaintCanvasUtils.createSVGPoint(e.offsetX, e.offsetY);
        this.rectEnd = KnitpaintCanvasUtils.createSVGPoint(e.offsetX, e.offsetY);
        requestRender();
      });

    fromEvent(canvas, 'mousemove')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.rectStart))
      .subscribe((e: MouseEvent) => {
        this.rectEnd = KnitpaintCanvasUtils.createSVGPoint(e.offsetX, e.offsetY);
        requestRender();
      });

    fromEvent(document, 'mouseup')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.rectStart))
      .subscribe((e: MouseEvent) => {
        this.applyRectangle();
        requestRender();
        delete this.rectStart;
        delete this.rectEnd;
      });
  }

  private attachTouchEvents(canvas: HTMLCanvasElement, requestRender: () => void): void {
    fromEvent(canvas, 'touchstart')
      .pipe(takeUntil(this.unloadSubject), filter((e: TouchEvent) => e.touches.length === 1))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        const boundary = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.rectStart = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
        this.rectEnd = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
        requestRender();
      });

    fromEvent(canvas, 'touchmove')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.rectStart))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        const boundary = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.rectEnd = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
        requestRender();
      });

    fromEvent(document, 'touchend')
      .pipe(takeUntil(this.unloadSubject), filter(() => !!this.rectStart))
      .subscribe((e: TouchEvent) => {
        e.preventDefault();
        this.applyRectangle();
        requestRender();
        delete this.rectStart;
        delete this.rectEnd;
      });
  }

  private applyRectangle() {
    if (!this.rectStart || !this.rectEnd) {
      return;
    }

    // Find the knitpaint coordinates
    let start, end;
    [start, end] = this.getKnitpaintRect();

    // Apply pixel by pixel
    let knitpaint = this.knitpaint;
    for (let x = start.x; x < end.x; x++) {
      for (let y = start.y; y < end.y; y++) {
        const knitpaintIndex = y * knitpaint.width + x;
        knitpaint = knitpaint.setColorNumber(knitpaintIndex, this.colorNumber);
      }
    }
    this.setKnitpaint(knitpaint);
  }

  private getKnitpaintRect(): [SVGPoint, SVGPoint] {
    const start = this.rectStart.matrixTransform(this.transform.inverse());
    const end = this.rectEnd.matrixTransform(this.transform.inverse());
    start.x = Math.round(start.x);
    start.y = Math.round(start.y);
    end.x = Math.round(end.x);
    end.y = Math.round(end.y);
    const startX = Math.max(0, Math.min(start.x, end.x));
    const startY = Math.max(0, Math.min(start.y, end.y));
    const endX = Math.min(this.knitpaint.width, Math.max(start.x, end.x));
    const endY = Math.min(this.knitpaint.height, Math.max(start.y, end.y));
    return [KnitpaintCanvasUtils.createSVGPoint(startX, startY), KnitpaintCanvasUtils.createSVGPoint(endX, endY)];
  }
}
