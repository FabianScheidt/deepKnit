import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { Knitpaint } from '../knitpaint';
import { TooltipService } from '../tooltip.service';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ColorInfoTool implements KnitpaintTool {

  public name = 'Color Info';
  private width: number;
  private height: number;
  private colorNumbers: number[];
  private transform: SVGMatrix;
  private mouseX: number;
  private mouseY: number;
  private readonly knitpaintChanged: Subject<void> = new Subject<void>();
  private readonly unloadSubject: Subject<void> = new Subject<void>();

  // Helper element to create SVGMatrix and SVGPoint
  private readonly someSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  constructor(private ngZone: NgZone, private tooltipService: TooltipService) { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.attachTooltipEvents(canvas);
  }

  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaintChanged.next();
    knitpaint.width
      .pipe(takeUntil(this.knitpaintChanged))
      .subscribe((width: number) => this.width = width);
    knitpaint.height
      .pipe(takeUntil(this.knitpaintChanged))
      .subscribe((height: number) => this.height = height);
    knitpaint.getColorNumbers()
      .pipe(takeUntil(this.knitpaintChanged))
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
    delete this.height;
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
      fromEvent(canvas, 'mouseout').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
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
      let point = this.someSVG.createSVGPoint();
      point.x = x;
      point.y = y;
      point = point.matrixTransform(this.transform.inverse());

      if (point.x >= 0 && point.x < this.width && point.y >= 0 && point.y < this.height) {
        const index = Math.floor(point.y) * this.width + Math.floor(point.x);
        return this.colorNumbers[index];
      }
    }
    return null;
  }
}
