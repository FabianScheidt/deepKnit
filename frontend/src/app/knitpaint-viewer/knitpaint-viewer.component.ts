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

@Component({
  selector: 'app-knitpaint-viewer',
  templateUrl: './knitpaint-viewer.component.html',
  styleUrls: ['./knitpaint-viewer.component.scss']
})
export class KnitpaintViewerComponent implements AfterViewInit, OnChanges {

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  @Input() knitpaint: Knitpaint;
  @Input() pixelsPerRow: number;
  @Input() pixelSize = 10;
  @Input() drawingColorNumber: number = null;
  private ctx: CanvasRenderingContext2D;
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
      this.canvas.nativeElement.addEventListener('mousedown', (event) => {
        isDown = true;
        this.drawPixel(event.offsetX, event.offsetY);
      });
      this.canvas.nativeElement.addEventListener('mouseup', () => {
        isDown = false;
      });
      this.canvas.nativeElement.addEventListener('mousemove', (event) => {
        if (isDown) {
          this.drawPixel(event.offsetX, event.offsetY);
        }
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
      this.knitpaint.getColors().subscribe(colors => {
        this.colors.next(colors);
      });
    }
  }

  /**
   * Resizes the canvas to fit all pixel and draws all the pixels
   */
  private renderCanvas() {
    if (!this.canvas || !this.canvas.nativeElement) {
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
  }

  /**
   * Draws the currently selected color number to the provided canvas coordinates
   *
   * @param canvasX
   * @param canvasY
   */
  private drawPixel(canvasX, canvasY) {
    const pixels = this.colors.getValue();
    const height = Math.ceil(pixels.length / this.pixelsPerRow);
    const xIndex = Math.floor(canvasX / this.pixelSize);
    const yIndex = height - Math.ceil(canvasY / this.pixelSize);
    const index = yIndex * this.pixelsPerRow + xIndex;
    this.setColor(index);
  }

  /**
   * Sets the currently selected color number for the provided color index
   *
   * @param index
   */
  setColor(index) {
    if (this.drawingColorNumber) {
      const colors: Color[] = this.colors.getValue();

      // Todo: Build the correct functionality and reflect to knitpaint data
      colors[index] = [255, 255, 0];
      this.colors.next(colors);
      console.log(colors[index]);
    }
  }

}
