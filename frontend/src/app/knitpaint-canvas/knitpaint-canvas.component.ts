import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Knitpaint } from '../knitpaint';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintTool } from '../knitpaint-tools/knitpaint-tool';

@Component({
  selector: 'app-knitpaint-canvas',
  templateUrl: './knitpaint-canvas.component.html',
  styleUrls: ['./knitpaint-canvas.component.scss']
})
export class KnitpaintCanvasComponent implements AfterViewInit, OnChanges {

  @Input() knitpaint: Knitpaint;
  @Input() enableGrid = true;
  @Input() activeTools: KnitpaintTool[] = [];

  @ViewChild('canvas') private canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;
  private knitpaintChanged = new Subject();

  // Cached state of the knitpaint
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
  }

  /**
   * Updates cached values and notifies tools whenever inputs change
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    // Update knitpaint
    if (changes['knitpaint'] && this.knitpaint) {
      this.changeKnitpaint(this.knitpaint);
    }

    // Render the canvas if the grid is toggled
    if (changes['enableGrid']) {
      this.renderCanvas();
    }

    // Allow proper change of tools
    if (changes['activeTools']) {
      const prev = <KnitpaintTool[]>changes['activeTools'].previousValue;
      const curr = <KnitpaintTool[]>changes['activeTools'].currentValue;
      this.changeTools(prev, curr);
    }
  }

  /**
   * Sets a new knitpaint object and makes sure that cached values are correct and tools are informed
   *
   * @param knitpaint
   */
  private changeKnitpaint(knitpaint: Knitpaint) {
    // Emit knitpaintChanged to unsubscribe from previous subscriptions
    this.knitpaintChanged.next();

    // Subscribe to color numbers, image data, width and height and render canvas whenever one of these changes
    combineLatest(this.knitpaint.getImage(), this.knitpaint.width, this.knitpaint.height)
      .pipe(takeUntil(this.knitpaintChanged))
      .subscribe(([image, width, height]) => {
        this.image = image;
        this.width = width;
        this.height = height;
        this.renderCanvas();
      });

    // Notify tools about the change
    for (const tool of this.activeTools) {
      if (tool.knitpaintAvailable) {
        tool.knitpaintAvailable(this.knitpaint);
      }
    }
  }

  /**
   * Sets a new view transformations matrix and makes sure that tools are informed
   *
   * @param transform
   */
  private setTransform(transform: SVGMatrix) {
    // Set the new matrix
    this.transform = transform;

    // Notify tools
    for (const tool of this.activeTools) {
      if (tool.transformAvailable) {
        tool.transformAvailable(this.transform);
      }
    }

    // Render the canvas
    this.renderCanvas();
  }

  /**
   * Sets a new set of tools and calls the appropriate load and unload methods
   *
   * @param prevTools
   * @param currTools
   */
  private changeTools(prevTools: KnitpaintTool[], currTools: KnitpaintTool[]) {
    prevTools = prevTools || [];
    currTools = currTools || [];

    // Unload old tools
    for (const prevTool of prevTools) {
      if (currTools.indexOf(prevTool) === -1 && prevTool.unload) {
        prevTool.unload();
      }
    }

    // Load new tools
    for (const currTool of currTools) {
      if (prevTools.indexOf(currTool) === -1) {
        if (currTool.load) {
          currTool.load(
            this.canvas.nativeElement,
            () => this.renderCanvas(),
            (transform: SVGMatrix) => this.setTransform(transform));
        }
        if (currTool.transformAvailable) {
          currTool.transformAvailable(this.transform);
        }
        if (currTool.knitpaintAvailable) {
          currTool.knitpaintAvailable(this.knitpaint);
        }
      }
    }
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
    let transform = this.someSVG.createSVGMatrix();
    const canvasWidth = this.canvas.nativeElement.offsetWidth;
    const canvasHeight = this.canvas.nativeElement.offsetHeight;

    // Move coordinates to center
    transform = transform.translate(canvasWidth / 2, canvasHeight / 2);

    // Scale to fit
    const xScale = this.canvas.nativeElement.offsetWidth / this.width;
    const yScale = this.canvas.nativeElement.offsetHeight / this.height;
    const scale = Math.min(xScale, yScale);
    transform = transform.scale(scale);

    // Knitpaint flows bottom to top
    transform = transform.flipY();

    // Center knitpaint
    this.setTransform(transform.translate(-this.width / 2, -this.height / 2));
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

    // Allow the active tools to render something
    for (const tool of this.activeTools) {
      if (tool.render) {
        tool.render(this.ctx, this.transform);
      }
    }
  }

}
