import {
  AfterViewInit,
  Component,
  ElementRef,
  Input, NgZone,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Color, Knitpaint } from '../knitpaint';
import { BehaviorSubject } from 'rxjs';
import saveAs from 'file-saver';

@Component({
  selector: 'app-knitpaint-viewer',
  templateUrl: './knitpaint-viewer.component.html',
  styleUrls: ['./knitpaint-viewer.component.scss']
})
export class KnitpaintViewerComponent implements AfterViewInit, OnChanges {

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('tooltip') tooltip: ElementRef<HTMLDivElement>;
  @Input() knitpaint: Knitpaint;
  @Input() pixelsPerRow: number;
  @Input() pixelSize = 10;
  @Input() drawingColorNumber: number = null;
  private ctx: CanvasRenderingContext2D;
  public colorNumbers: BehaviorSubject<number[]> = new BehaviorSubject([]);
  public colors: BehaviorSubject<Color[]> = new BehaviorSubject<Color[]>([]);

  constructor(private element: ElementRef<HTMLElement>, private ngZone: NgZone) {
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

    // Attach some events to allow drawing
    this.ngZone.runOutsideAngular(() => {
      let isDown = false;
      const canvasEl = this.canvas.nativeElement;
      const tooltipEl = this.tooltip.nativeElement;
      canvasEl.addEventListener('mousedown', (event) => {
        isDown = true;
        this.drawColorNumber(event.offsetX, event.offsetY);
        tooltipEl.innerText = '' + this.getColorNumber(event.offsetX, event.offsetY);
      });
      canvasEl.addEventListener('mouseup', () => {
        isDown = false;
      });
      canvasEl.addEventListener('mouseover', () => {
        tooltipEl.style.display = 'block';
      });
      canvasEl.addEventListener('mousemove', (event) => {
        if (isDown) {
          this.drawColorNumber(event.offsetX, event.offsetY);
        }
        tooltipEl.style.left = (event.offsetX + 5) + 'px';
        tooltipEl.style.top = (event.offsetY + 10) + 'px';
        const colorNumber = this.getColorNumber(event.offsetX, event.offsetY);
        tooltipEl.innerText = 'No. ' + colorNumber + ': ' + Knitpaint.COLOR_LABELS[colorNumber];
      });
      canvasEl.addEventListener('mouseout', () => {
        tooltipEl.style.display = 'none';
      });
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
    // Extract the colors when the knitpaint changes
    if (changes['knitpaint'] && this.knitpaint) {
      // Todo: Unsubscribe when reference changes
      this.knitpaint.getColorNumbers().subscribe(colorNumbers => {
        this.colorNumbers.next(colorNumbers);
      });
      this.knitpaint.getColors().subscribe(colors => {
        this.colors.next(colors);
      });
    }
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
      this.ctx.fillStyle = 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
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
    if (this.drawingColorNumber !== null && this.drawingColorNumber >= 0) {
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
