import { Injectable } from '@angular/core';
import { KnitpaintTool } from '../knitpaint-tool';
import { Knitpaint } from '../../knitpaint';
import { AbstractStartEndTool } from './abstract-start-end-tool';

@Injectable()
export class RectangleTool extends AbstractStartEndTool implements KnitpaintTool {

  public readonly name = 'Rectangle Tool';
  public colorNumber = 0;
  private setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void;

  constructor() {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void,
       setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void, _): void {
    this.setKnitpaint = setKnitpaint;
    super.load(canvas, requestRender);
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    const knitpaintRect = this.getKnitpaintRect();
    if (!knitpaintRect) {
      return;
    }
    const [start, end] = knitpaintRect;

    // Draw the rectangle
    ctx.save();
    ctx.transform(this.transform.a, this.transform.b, this.transform.c, this.transform.d, this.transform.e, this.transform.f);
    ctx.fillStyle = Knitpaint.getColorString(this.colorNumber);
    ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.restore();
  }

  unload(): void {
    delete this.setKnitpaint;
    super.unload();
  }

  protected apply(requestRender: () => void) {
    const knitpaintRect = this.getKnitpaintRect();
    if (!knitpaintRect) {
      return;
    }
    const [start, end] = knitpaintRect;

    // Apply pixel by pixel
    let knitpaint = this.knitpaint;
    for (let x = start.x; x < end.x; x++) {
      for (let y = start.y; y < end.y; y++) {
        const knitpaintIndex = y * knitpaint.width + x;
        knitpaint = knitpaint.setColorNumber(knitpaintIndex, this.colorNumber);
      }
    }

    this.setKnitpaint(knitpaint);
    super.apply(requestRender);
  }
}
