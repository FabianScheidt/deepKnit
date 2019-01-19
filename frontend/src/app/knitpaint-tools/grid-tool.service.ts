import { Injectable } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { Subject } from 'rxjs';
import { Knitpaint } from '../knitpaint';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GridTool implements KnitpaintTool {

  public readonly name = 'Grid';
  private width: number;
  private height: number;
  private requestRender: () => void;
  private readonly knitpaintChanged: Subject<void> = new Subject<void>();
  private readonly unloadSubject: Subject<void> = new Subject<void>();

  // Helper element to create SVGMatrix and SVGPoint
  private readonly someSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  constructor() { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.requestRender = requestRender;
    this.requestRender();
  }

  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaintChanged.next();
    knitpaint.width
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((width: number) => this.width = width);
    knitpaint.height
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((height: number) => this.height = height);
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    this.renderGrid(ctx, transform);
  }

  unload(): void {
    this.requestRender();
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
   * Renders a grid into the provided canvas context
   *
   * @param ctx
   * @param transform
   */
  private renderGrid(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    ctx.save();
    ctx.strokeStyle = '#ffffff';

    // Helper function to manually transform coordinates and round them for crisper and scale independent lines
    const roundTransform = (point: SVGPoint) => {
      const transformedPoint = point.matrixTransform(transform);
      transformedPoint.x = Math.round(transformedPoint.x);
      transformedPoint.y = Math.round(transformedPoint.y);
      return transformedPoint;
    };

    // Horizontal
    for (let y = 1; y < this.height; y++) {
      let startPoint = this.createPoint(0, y);
      startPoint = roundTransform(startPoint);
      let endPoint = this.createPoint(this.width, y);
      endPoint = roundTransform(endPoint);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.lineWidth = (y % 5 === 0 ? 0.5 : 0.2);
      ctx.stroke();
    }

    // Vertical
    for (let x = 1; x < this.width; x++) {
      let startPoint = this.createPoint(x, 0);
      startPoint = roundTransform(startPoint);
      let endPoint = this.createPoint(x, this.height);
      endPoint = roundTransform(endPoint);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.lineWidth = (x % 5 === 0 ? 0.5 : 0.2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
