import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { Knitpaint } from '../knitpaint';
import { TooltipService } from '../tooltip.service';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class ColorInfoTool implements KnitpaintTool {

  public name = 'Color Info';
  private width: number;
  private colorNumbers: number[];
  private transform: SVGMatrix;
  private mouseX: number;
  private mouseY: number;
  private readonly knitpaintChanged: Subject<void> = new Subject<void>();
  private readonly unloadSubject: Subject<void> = new Subject<void>();

  constructor(private ngZone: NgZone, private tooltipService: TooltipService) { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.attachTooltipEvents(canvas);
  }

  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaintChanged.next();
    knitpaint.width
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((width: number) => this.width = width);
    knitpaint.getColorNumbers()
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((colorNumbers: number[]) => this.colorNumbers = colorNumbers);
  }

  transformAvailable(transform: SVGMatrix): void {
    this.transform = transform;
    this.ngZone.runOutsideAngular(() => {
      this.updateTooltip();
    });
  }

  unload(): void {
    delete this.width;
    delete this.colorNumbers;
    delete this.transform;
    delete this.mouseX;
    delete this.mouseY;
    this.unloadSubject.next();
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
    if (this.colorNumbers && this.transform) {
      const index = KnitpaintCanvasUtils.getIndexAtCoordinates(x, y, this.width, this.transform.inverse());
      if (index && index < this.colorNumbers.length) {
        return this.colorNumbers[index];
      }
    }
    return null;
  }
}
