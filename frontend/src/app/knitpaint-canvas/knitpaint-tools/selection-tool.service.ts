import { Injectable } from '@angular/core';
import { AbstractStartEndTool } from './abstract-start-end-tool';
import { KnitpaintTool } from '../knitpaint-tool';
import { Knitpaint } from '../../knitpaint';

@Injectable()
export class SelectionTool extends AbstractStartEndTool implements KnitpaintTool {

  public readonly name = 'Selection Tool';
  public selection: Knitpaint;
  private setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void;

  constructor() {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void,
       setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void, __?): void {
    this.setKnitpaint = setKnitpaint;
    super.load(canvas, requestRender, setKnitpaint, __);
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    const knitpaintRect = this.getKnitpaintRect();
    if (!knitpaintRect) {
      return;
    }

    ctx.save();
    ctx.transform(this.transform.a, this.transform.b, this.transform.c, this.transform.d, this.transform.e, this.transform.f);

    ctx.moveTo(0, 0);
    ctx.lineTo(this.knitpaint.width, 0);
    ctx.lineTo(this.knitpaint.width, this.knitpaint.height);
    ctx.lineTo(0, this.knitpaint.height);
    ctx.lineTo(0, 0);
    ctx.closePath();

    ctx.moveTo(knitpaintRect[0].x, knitpaintRect[0].y);
    ctx.lineTo(knitpaintRect[0].x, knitpaintRect[1].y);
    ctx.lineTo(knitpaintRect[1].x, knitpaintRect[1].y);
    ctx.lineTo(knitpaintRect[1].x, knitpaintRect[0].y);
    ctx.lineTo(knitpaintRect[0].x, knitpaintRect[0].y);
    ctx.closePath();


    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  }

  protected apply() {
    const knitpaintRect = this.getKnitpaintRect();
    if (!knitpaintRect) {
      this.selection = null;
    } else {
      const x = knitpaintRect[0].x;
      const y = knitpaintRect[0].y;
      const width = knitpaintRect[1].x - x;
      const height = knitpaintRect[1].y - y;
      this.selection = this.knitpaint.slice(x, y, width, height);
      console.log(this.selection);
    }
  }

  public fillWithPattern(pattern: Knitpaint) {
    const knitpaintRect = this.getKnitpaintRect();
    const width = knitpaintRect[1].x - knitpaintRect[0].x;
    const height = knitpaintRect[1].y - knitpaintRect[0].y;
    const fill = pattern.repeatToSize(width, height);
    const knitpaint = this.knitpaint.applyOther(fill, knitpaintRect[0].x, knitpaintRect[0].y);
    this.setKnitpaint(knitpaint);
  }
}
