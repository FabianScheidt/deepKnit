import { Injectable, NgZone } from '@angular/core';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { KnitpaintTool } from '../knitpaint-tool';
import { Knitpaint } from '../../knitpaint';
import { fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

@Injectable()
export class TextureTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Texture Tool';
  private canvas: HTMLCanvasElement;
  private mousePosition: SVGPoint = null;

  // Options for the texture itself and possible transformations
  private _texture: Knitpaint;
  private _flipX = false;
  private _flipY = false;
  private _invert = false;
  private _repeatX = 1;
  private _repeatY = 1;

  // Use getters and setters to make sure that the transformations are applied
  public get texture(): Knitpaint { return this._texture; }
  public set texture(texture: Knitpaint) {
    this._texture = texture;
    this.applyTextureTransformations();
  }
  public get flipX(): boolean { return this._flipX; }
  public set flipX(flipX: boolean) {
    this._flipX = flipX;
    this.applyTextureTransformations();
  }
  public get flipY(): boolean { return this._flipY; }
  public set flipY(flipY: boolean) {
    this._flipY = flipY;
    this.applyTextureTransformations();
  }
  public get invert(): boolean { return this._invert; }
  public set invert(invert: boolean) {
    this._invert = invert;
    this.applyTextureTransformations();
  }
  public get repeatX(): number { return this._repeatX; }
  public set repeatX(repeatX: number) {
    this._repeatX = repeatX;
    this.applyTextureTransformations();
  }
  public get repeatY(): number { return this._repeatY; }
  public set repeatY(repeatY: number) {
    this._repeatY = repeatY;
    this.applyTextureTransformations();
  }

  // Store results of transformations here
  private transformedTexture: Knitpaint;
  private transformedTextureImage: HTMLCanvasElement;

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void,
       setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void, _): void {
    this.canvas = canvas;

    // Attach events
    this.attachMoveEvents(canvas, requestRender);
    this.attachClickEvent(canvas, setKnitpaint);
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    // Reset the default cursor
    this.canvas.style.cursor = 'default';

    // Only draw if texture and mouse position is available
    if (!this.transformedTexture || !this.transformedTexture || !this.mousePosition) {
      return;
    }

    // Find coordinates
    const canvasCoordinates = this.getCanvasCoordinates();
    if (!canvasCoordinates) {
      return;
    }

    // No cursor needed
    this.canvas.style.cursor = 'none';

    // Draw the texture image
    ctx.save();
    ctx.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.transformedTextureImage, canvasCoordinates.x, canvasCoordinates.y);
    ctx.restore();
  }

  unload(): void {
    delete this.mousePosition;
    super.unload();
  }


  /**
   * Stores the mouse position and request rendering whenever the mouse move or goes out
   *
   * @param canvas
   * @param requestRender
   */
  private attachMoveEvents(canvas: HTMLCanvasElement, requestRender: () => void) {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        this.mousePosition = KnitpaintCanvasUtils.createSVGPoint(event.offsetX, event.offsetY);
        requestRender();
      });
      fromEvent(canvas, 'mouseout').pipe(takeUntil(this.unloadSubject)).subscribe(() => {
        this.mousePosition = null;
        requestRender();
      });
      merge(fromEvent(canvas, 'touchstart'), fromEvent(canvas, 'touchmove'))
        .pipe(takeUntil(this.unloadSubject))
        .subscribe((e: TouchEvent) => {
          if (e.touches.length === 1) {
            e.preventDefault();
            const boundary = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mousePosition = KnitpaintCanvasUtils.createSVGPoint(touch.pageX - boundary.left, touch.pageY - boundary.top);
            requestRender();
          } else {
            this.mousePosition = null;
          }
        });
    });
  }

  /**
   * Attaches the click event that applies the texture
   *
   * @param canvas
   * @param setKnitpaint
   */
  private attachClickEvent(canvas: HTMLCanvasElement, setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void) {
    fromEvent(canvas, 'click').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
      this.mousePosition = KnitpaintCanvasUtils.createSVGPoint(event.offsetX, event.offsetY);
      this.applyTexture(setKnitpaint);
    });
    fromEvent(canvas, 'touchend').pipe(takeUntil(this.unloadSubject)).subscribe((e: TouchEvent) => {
      this.applyTexture(setKnitpaint);
      this.mousePosition = null;
    });
  }

  /**
   * Applies the texture at the current mouse position and sets a new knitpaint
   *
   * @param setKnitpaint
   */
  private applyTexture(setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void): void {
    const offset = this.getCanvasCoordinates();
    const knitpaint = this.knitpaint.applyOther(this.transformedTexture, offset.x, offset.y);
    setKnitpaint(knitpaint);
  }

  /**
   * Returns the canvas coordinates needed for drawing the texture
   */
  private getCanvasCoordinates(): SVGPoint {
    // Transform mouse position into canvas coordinates
    const mouseTransformed = this.mousePosition.matrixTransform(this.transform.inverse());

    // The actual position should be in the center
    const x = Math.floor(mouseTransformed.x - this.transformedTexture.width / 2);
    const y = Math.floor(mouseTransformed.y - this.transformedTexture.height / 2);

    // Only continue if texture is on the canvas
    if (x < 0 || x  > this.knitpaint.width - this.transformedTexture.width
      || y < 0 || y > this.knitpaint.height - this.transformedTexture.height) {
      return null;
    }
    return KnitpaintCanvasUtils.createSVGPoint(x, y);
  }

  /**
   * Applies transformations the the texture and creates an image of the result
   */
  private applyTextureTransformations(): void {
    let transformedTexture = this.texture;
    transformedTexture = transformedTexture.flip(this.flipX, this.flipY);
    if (this.invert) {
      transformedTexture = transformedTexture.invert();
    }
    transformedTexture = transformedTexture.repeat(this.repeatX, this.repeatY);
    this.transformedTexture = transformedTexture;
    this.transformedTextureImage = this.transformedTexture.getImage();
  }
}
