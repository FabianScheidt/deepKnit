import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { Knitpaint } from '../knitpaint';
import { TooltipService } from '../tooltip.service';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class ColorInfoTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public name = 'Color Info';
  private mouseX: number;
  private mouseY: number;

  constructor(private ngZone: NgZone, private tooltipService: TooltipService) {
    super();
  }

  load(canvas: HTMLCanvasElement): void {
    this.attachTooltipEvents(canvas);
  }

  transformAvailable(transform: SVGMatrix): void {
    super.transformAvailable(transform);
    this.ngZone.runOutsideAngular(() => {
      this.updateTooltip();
    });
  }

  unload(): void {
    super.unload();
    delete this.mouseX;
    delete this.mouseY;
  }

  /**
   * Attaches all events needed for the tooltip showing the current color
   *
   * @param canvas
   * Canvas to attach events to
   */
  private attachTooltipEvents(canvas: HTMLCanvasElement) {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        this.mouseX = event.offsetX;
        this.mouseY = event.offsetY;
        this.updateTooltip();
      });
      fromEvent(canvas, 'mouseout').pipe(takeUntil(this.unloadSubject)).subscribe(() => {
        this.tooltipService.visible.next(false);
      });
    });
  }

  /**
   * Updates the tooltip to the stored mouse position
   */
  private updateTooltip() {
    const colorNumber = this.getColorNumber(this.mouseX, this.mouseY);
    if (colorNumber !== null) {
      const tooltipText = 'No. ' + colorNumber + ': ' + Knitpaint.COLOR_LABELS[colorNumber];
      this.tooltipService.visible.next(true);
      this.tooltipService.text.next(tooltipText);
    } else {
      this.tooltipService.visible.next(false);
    }
  }

  /**
   * Returns the color number for the provided canvas coordinates
   *
   * @param x
   * @param y
   */
  private getColorNumber(x: number, y: number): number {
    if (this.knitpaint && this.transform) {
      const colorNumbers = this.knitpaint.getColorNumbers();
      const index = KnitpaintCanvasUtils.getIndexAtCoordinates(x, y, this.knitpaint.width, this.transform.inverse());
      if (index === 0 || (index && index < colorNumbers.length)) {
        return colorNumbers[index];
      }
    }
    return null;
  }
}
