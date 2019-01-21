import { Injectable } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';

@Injectable({
  providedIn: 'root'
})
export class GridTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Grid';
  private requestRender: () => void;

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.requestRender = requestRender;
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    this.renderGrid(ctx, transform);
  }

  unload(): void {
    super.unload();
    delete this.requestRender;
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
    for (let y = 1; y < this.knitpaintHeight; y++) {
      let startPoint = KnitpaintCanvasUtils.createSVGPoint(0, y);
      startPoint = roundTransform(startPoint);
      let endPoint = KnitpaintCanvasUtils.createSVGPoint(this.knitpaintWidth, y);
      endPoint = roundTransform(endPoint);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.lineWidth = (y % 5 === 0 ? 0.5 : 0.2);
      ctx.stroke();
    }

    // Vertical
    for (let x = 1; x < this.knitpaintWidth; x++) {
      let startPoint = KnitpaintCanvasUtils.createSVGPoint(x, 0);
      startPoint = roundTransform(startPoint);
      let endPoint = KnitpaintCanvasUtils.createSVGPoint(x, this.knitpaintHeight);
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
