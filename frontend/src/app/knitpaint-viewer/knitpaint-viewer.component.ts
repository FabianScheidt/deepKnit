import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  Input, NgZone,
  OnChanges, OnDestroy, Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Color, Knitpaint } from '../knitpaint';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import saveAs from 'file-saver';
import { takeUntil } from 'rxjs/operators';
import { TooltipService } from '../tooltip.service';

@Component({
  selector: 'app-knitpaint-viewer',
  templateUrl: './knitpaint-viewer.component.html',
  styleUrls: ['./knitpaint-viewer.component.scss']
})
export class KnitpaintViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  @Input() knitpaint: Knitpaint;
  @Input() pixelsPerRow: number;
  @Input() pixelSize = 10;
  @Input() enableTooltip = true;
  @Input() enableDrawing = false;
  @Input() drawingColorNumber = 0;
  @Input() enableSelection = false;
  @Input() selection: [number, number] = null;
  @Output() selectionChange: EventEmitter<[number, number]> = new EventEmitter<[number, number]>();
  private ctx: CanvasRenderingContext2D;
  private colorNumbers: BehaviorSubject<number[]> = new BehaviorSubject([]);
  private colors: BehaviorSubject<Color[]> = new BehaviorSubject<Color[]>([]);
  private knitpaintChanged: Subject<void> = new Subject();
  private isDestroyed: Subject<boolean> = new Subject<boolean>();

  constructor(private ngZone: NgZone, private tooltipService: TooltipService) {
    // Redraw the canvas whenever the colors change
    this.colors.subscribe(() => {
      this.renderCanvas();
    });
  }

  /**
   * Prepares the canvas
   */
  ngAfterViewInit() {
    // Get a reference to the canvas context
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Attach some events depending on the configured options
    if (this.enableSelection && this.enableDrawing) {
      console.warn('Drawing and selection should not be used together');
    }
    if (this.enableDrawing) {
      this.attachDrawingEvents();
    }
    if (this.enableSelection) {
      this.attachSelectionEvents();
    }
    if (this.enableTooltip) {
      this.attachTooltipEvents();
    }

    // Render the canvas whenever the selection changes
    this.selectionChange.subscribe(() => {
      this.renderCanvas();
    });

    // Render the canvas
    this.renderCanvas();
  }

  /**
   * Updates the current colors when the knitpaint data changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['knitpaint'] && this.knitpaint) {

      // Emit knitpaintChanged to unsubscribe from previous subscriptions
      this.knitpaintChanged.next();

      // Subscribe to color numbers and color data
      this.knitpaint.getColorNumbers()
        .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.isDestroyed))
        .subscribe(colorNumbers => this.colorNumbers.next(colorNumbers));
      this.knitpaint.getColors()
        .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.isDestroyed))
        .subscribe(colors => this.colors.next(colors));
    }
  }

  /**
   * Marks isDestroyed as true to unsubscribe from any open observable
   */
  ngOnDestroy() {
    this.isDestroyed.next(true);
  }

  /**
   * Attaches all events needed to allow knitpaint drawing
   */
  private attachDrawingEvents() {
    this.ngZone.runOutsideAngular(() => {
      let isDown = false;
      const canvasEl = this.canvas.nativeElement;

      fromEvent(canvasEl, 'mousedown').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        isDown = true;
        this.drawColorNumber(event.offsetX, event.offsetY);
      });
      fromEvent(canvasEl, 'mousemove').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        if (isDown) {
          this.drawColorNumber(event.offsetX, event.offsetY);
        }
      });
      fromEvent(document, 'mouseup').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        isDown = false;
      });
    });
  }

  /**
   * Attaches all events needed to allow selection of rows
   */
  private attachSelectionEvents() {
    this.ngZone.runOutsideAngular(() => {
      const canvasEl = this.canvas.nativeElement;
      let selectionStartY = null;
      let moved = false;
      fromEvent(canvasEl, 'mousedown').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        selectionStartY = event.offsetY;
      });
      const updateSelection = (event: MouseEvent) => {
        if (selectionStartY !== null) {
          const selectionEndY = event.offsetY;

          // Deselect if the mouse didn't move
          if (!moved) {
            this.ngZone.run(() => {
              this.selection = null;
              this.selectionChange.emit(null);
            });
            return;
          }

          // Find the indices of the selection based on the start and end coordinates
          const startX = 0;
          const endX = canvasEl.offsetWidth - 0.1;
          const startY = Math.max(selectionStartY, selectionEndY);
          const endY = Math.min(selectionStartY, selectionEndY);
          const startIndex = this.getColorIndex(startX, startY);
          const endIndex = this.getColorIndex(endX, endY);
          const newSelection: [number, number] = [startIndex, endIndex];

          // Only emit the update if the selection actually changed
          if (this.selection == null || newSelection[0] !== this.selection[0] || newSelection[1] !== this.selection[1]) {
            this.ngZone.run(() => {
              this.selection = newSelection;
              this.selectionChange.emit(this.selection);
            });
          }
        }
      };
      fromEvent(canvasEl, 'mousemove').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        if (selectionStartY !== null) {
          moved = true;
          updateSelection(event);
        }
      });
      fromEvent(document, 'mouseup').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        updateSelection(event);
        selectionStartY = null;
        moved = false;
      });
    });
  }

  /**
   * Attaches all events needed for the tooltip showing the current color
   */
  private attachTooltipEvents() {
    this.ngZone.runOutsideAngular(() => {
      const canvasEl = this.canvas.nativeElement;

      fromEvent(canvasEl, 'mouseover').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        this.tooltipService.visible.next(true);
      });
      const updateTooltip = (event: MouseEvent) => {
        const colorNumber = this.getColorNumber(event.offsetX, event.offsetY);
        const tooltipText = 'No. ' + colorNumber + ': ' + Knitpaint.COLOR_LABELS[colorNumber];
        this.tooltipService.text.next(tooltipText);
      };
      fromEvent(canvasEl, 'mousemove').pipe(takeUntil(this.isDestroyed)).subscribe(updateTooltip);
      fromEvent(canvasEl, 'mousedown').pipe(takeUntil(this.isDestroyed)).subscribe(updateTooltip);
      fromEvent(canvasEl, 'mouseout').pipe(takeUntil(this.isDestroyed)).subscribe((event: MouseEvent) => {
        this.tooltipService.visible.next(false);
      });
    });
  }

  /**
   * Resizes the canvas to fit all pixel and draws all the pixels
   * @param drawGrid
   */
  private renderCanvas(drawGrid?: boolean) {
    console.log('Rendering Knitpaint Canvas');
    if (!this.canvas || !this.canvas.nativeElement || !this.ctx) {
      return;
    }

    const pixels = this.colors.getValue();
    const pixelSize = this.pixelSize;

    // Calculate necessary width and height of the canvas and set it
    const canvasWidth = this.pixelsPerRow * pixelSize;
    const canvasHeight = Math.ceil(pixels.length / this.pixelsPerRow) * pixelSize;
    this.canvas.nativeElement.width = canvasWidth;
    this.canvas.nativeElement.height = canvasHeight;

    // Draw each pixel
    pixels.forEach((color: Color, index: number) => {
      const xIndex = index % this.pixelsPerRow;
      const yIndex = Math.floor(index / this.pixelsPerRow);
      const x = xIndex * pixelSize;
      const y = canvasHeight - (yIndex + 1) * pixelSize;
      const opacity = this.selection === null || (index >= this.selection[0] && index <= this.selection[1]) ? 1.0 : 0.5;
      this.ctx.fillStyle = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + opacity + ')';
      this.ctx.fillRect(x, y, pixelSize, pixelSize);
    });

    // Draw grid
    if (drawGrid || typeof drawGrid === 'undefined') {
      this.ctx.strokeStyle = '#ffffff';

      // Horizontal
      for (let i = 0; i < canvasHeight / pixelSize - 1; i++) {
        const y = (i + 1) * this.pixelSize;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(canvasWidth, y);
        this.ctx.lineWidth = i % 5 === 0 ? 0.4 : 0.15;
        this.ctx.stroke();
      }

      // Vertical
      for (let i = 0; i < canvasWidth / pixelSize - 1; i++) {
        const x = (i + 1) * this.pixelSize;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, canvasHeight);
        this.ctx.lineWidth = i % 5 === 0 ? 0.4 : 0.15;
        this.ctx.stroke();
      }
    }
  }

  /**
   * Returns the color number of the provided canvas coordinates
   * @param canvasX
   * @param canvasY
   */
  private getColorNumber(canvasX: number, canvasY: number): number {
    const index = this.getColorIndex(canvasX, canvasY);
    return this.colorNumbers.getValue()[index];
  }

  /**
   * Finds the index for the provided canvas coordinates
   *
   * @param canvasX
   * @param canvasY
   */
  private getColorIndex(canvasX: number, canvasY: number): number {
    const pixels = this.colors.getValue();
    const height = Math.ceil(pixels.length / this.pixelsPerRow);
    const xIndex = Math.floor(canvasX / this.pixelSize);
    const yIndex = height - Math.ceil(canvasY / this.pixelSize);
    return yIndex * this.pixelsPerRow + xIndex;
  }

  /**
   * Draws the currently selected color number to the provided canvas coordinates
   *
   * @param canvasX
   * @param canvasY
   */
  private drawColorNumber(canvasX: number, canvasY: number): void {
    const index = this.getColorIndex(canvasX, canvasY);
    this.setColor(index);
  }

  /**
   * Sets the currently selected color number for the provided color index
   *
   * @param index
   */
  setColor(index: number) {
    if (this.drawingColorNumber !== null && this.drawingColorNumber >= 0 && index >= 0) {
      this.knitpaint.setColorNumber(index, this.drawingColorNumber);
    }
  }

  /**
   * Exports the current canvas as a png file and immediately starts the download
   * @param filename
   */
  exportAsImage(filename?: string) {

    // Change the pixel size for the export to 1
    const pixelSize = this.pixelSize;
    this.pixelSize = 1;
    this.renderCanvas(false);

    // Create the png blob and set the pixel size back
    this.canvas.nativeElement.toBlob((blob: Blob) => {
      this.pixelSize = pixelSize;
      this.renderCanvas();
      if (blob) {
        saveAs(blob, filename);
      }
    }, 'image/png');
  }

}
