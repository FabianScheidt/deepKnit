import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Knitpaint } from '../knitpaint';
import { Subject, combineLatest, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-knitpaint-canvas',
  templateUrl: './knitpaint-canvas.component.html',
  styleUrls: ['./knitpaint-canvas.component.scss']
})
export class KnitpaintCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() knitpaint: Knitpaint;
  @Input() enableGrid = true;
  @Input() activeTool = null;

  @ViewChild('canvas') private canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;
  private knitpaintChanged = new Subject();
  private isDestroyed = new Subject<boolean>();

  // Cached state of the knitpaint
  private colorNumbers: number[] = [];
  private image: HTMLCanvasElement;
  private width = 0;
  private height = 0;

  // Current view transformation
  private transform: SVGMatrix;

  // Helper element to create SVGMatrix and SVGPoint
  private readonly someSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  constructor() {}

  /**
   * Prepares the canvas
   */
  ngAfterViewInit() {
    // Get a reference to the canvas context
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Reset transformations
    this.resetTransform();

    // Render
    this.renderCanvas();

    // Attach events for canvas transformations
    this.attachTransformEvents();
  }

  /**
   * Updates the cached state of the knitpaint whenever the input changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['knitpaint'] && this.knitpaint) {

      // Emit knitpaintChanged to unsubscribe from previous subscriptions
      this.knitpaintChanged.next();

      // Subscribe to color numbers, image data, width and height and render canvas whenever one of these changes
      combineLatest(this.knitpaint.getColorNumbers(), this.knitpaint.getImage(), this.knitpaint.width, this.knitpaint.height)
        .pipe(takeUntil(this.knitpaintChanged))
        .subscribe(([colorNumbers, image, width, height]) => {
          this.colorNumbers = colorNumbers;
          this.image = image;
          this.width = width;
          this.height = height;
          this.renderCanvas();
        });
    }
  }

  /**
   * Marks isDestroyed as true to unsubscribe from any open observable
   */
  ngOnDestroy() {
    this.isDestroyed.next(true);
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
   * Resets the view transformation to be centered and fit the canvas
   */
  public resetTransform() {
    this.transform = this.someSVG.createSVGMatrix();
    const canvasWidth = this.canvas.nativeElement.offsetWidth;
    const canvasHeight = this.canvas.nativeElement.offsetHeight;

    // Move coordinates to center
    this.transform = this.transform.translate(canvasWidth / 2, canvasHeight / 2);

    // Scale to fit
    const xScale = this.canvas.nativeElement.offsetWidth / this.width;
    const yScale = this.canvas.nativeElement.offsetHeight / this.height;
    const scale = Math.min(xScale, yScale);
    this.transform = this.transform.scale(scale);

    // Knitpaint flows bottom to top
    this.transform = this.transform.flipY();

    // Center knitpaint
    this.transform = this.transform.translate(-this.width / 2, -this.height / 2);
  }

  /**
   * Attaches event handlers to allow scaling and translating the canvas
   */
  private attachTransformEvents() {
    const canvas = this.canvas.nativeElement;

    // Define methods to translate and scale based on canvas coordinates
    const doTranslate = (x: number, y: number) => {
      const scale = Math.sqrt(this.transform.a * this.transform.a + this.transform.c * this.transform.c);
      this.transform = this.transform.scale(1 / scale).translate(x, y).scale(scale);
    };
    const doScale = (scale: number) => {
      const scaleCenter = mousePoint.matrixTransform(this.transform.inverse());
      this.transform = this.transform.translate(scaleCenter.x, scaleCenter.y).scale(scale).translate(-scaleCenter.x, -scaleCenter.y);
    };

    // Track the mouse as origin for scaling
    let mousePoint: SVGPoint;
    fromEvent(canvas, 'mousemove').subscribe((e: MouseEvent) => {
      mousePoint = this.createPoint(e.offsetX, e.offsetY);
    });

    // Track wheel events for translating and zooming
    fromEvent(canvas, 'wheel').subscribe((e: MouseWheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const t = this.transform;
        const currentScale = Math.sqrt(t.a * t.a + t.c * t.c);
        const scale = Math.abs((currentScale - e.deltaY * 0.1) / currentScale);
        doScale(scale);
      } else {
        doTranslate(-e.deltaX * 2, e.deltaY * 2);
      }
      this.renderCanvas();
    });

    // Track gestures for translating and zooming in browsers like Safari
    let gestureStartPoint: SVGPoint;
    let gestureStartTransform: SVGMatrix;

    fromEvent(canvas, 'gesturestart').subscribe((e: any) => {
      e.preventDefault();
      gestureStartPoint = this.createPoint(e.pageX, e.pageY);
      gestureStartTransform = this.transform.scale(1);
    });

    fromEvent(canvas, 'gesturechange').subscribe((e: any) => {
      e.preventDefault();
      this.transform = gestureStartTransform;
      doTranslate(e.pageX - gestureStartPoint.x, e.pageY - gestureStartPoint.y);
      doScale(e.scale);
      this.renderCanvas();
    });

    fromEvent(canvas, 'gestureend').subscribe((e: any) => {
      e.preventDefault();
    });
  }

  /**
   * Renders the canvas with the knitpaint and optionally the grid
   */
  private renderCanvas() {
    console.log('Rendering Knitpaint Canvas');
    if (!this.canvas || !this.canvas.nativeElement || !this.ctx) {
      console.warn('Knitpaint canvas not ready for drawing');
      return;
    }

    // Make sure that the canvas is set to its own dimensions
    this.canvas.nativeElement.width = this.canvas.nativeElement.offsetWidth;
    this.canvas.nativeElement.height = this.canvas.nativeElement.offsetHeight;

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    // Transform canvas according to current view state
    this.ctx.save();
    this.ctx.transform(this.transform.a, this.transform.b, this.transform.c, this.transform.d, this.transform.e, this.transform.f);

    // Draw pixels as image
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.image, 0, 0);

    this.ctx.restore();

    // Draw grid
    if (this.enableGrid) {
      this.ctx.strokeStyle = '#ffffff';

      // Helper function to manually transform coordinates and round them for crisper and scale independent lines
      const roundTransform = (point: SVGPoint) => {
        const transformedPoint = point.matrixTransform(this.transform);
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
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x, startPoint.y);
        this.ctx.lineTo(endPoint.x, endPoint.y);
        this.ctx.lineWidth = (y % 5 === 0 ? 0.5 : 0.2);
        this.ctx.stroke();
      }

      // Vertical
      for (let x = 1; x < this.width; x++) {
        let startPoint = this.createPoint(x, 0);
        startPoint = roundTransform(startPoint);
        let endPoint = this.createPoint(x, this.height);
        endPoint = roundTransform(endPoint);
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x, startPoint.y);
        this.ctx.lineTo(endPoint.x, endPoint.y);
        this.ctx.lineWidth = (x % 5 === 0 ? 0.5 : 0.2);
        this.ctx.stroke();
      }
    }
  }

}
