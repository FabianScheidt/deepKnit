import { Injectable } from '@angular/core';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { KnitpaintTool } from '../knitpaint-tool';
import { Knitpaint } from '../../knitpaint';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

@Injectable()
export class TextureTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public readonly name = 'Texture Tool';
  private canvas: HTMLCanvasElement;
  private _texture: Knitpaint;
  public get texture(): Knitpaint {
    return this._texture;
  }
  public set texture(texture: Knitpaint) {
    this._texture = texture;
    this.textureImage = texture.getImage();
  }
  private textureImage: HTMLCanvasElement;
  private mousePosition: SVGPoint = null;

  constructor() {
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
    if (!this.texture || !this.textureImage || !this.mousePosition) {
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
    ctx.setTransform(transform);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.textureImage, canvasCoordinates.x, canvasCoordinates.y);
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
    fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
      this.mousePosition = KnitpaintCanvasUtils.createSVGPoint(event.offsetX, event.offsetY);
      requestRender();
    });
    fromEvent(canvas, 'mouseout').pipe(takeUntil(this.unloadSubject)).subscribe(() => {
      this.mousePosition = null;
      requestRender();
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
  }

  /**
   * Applies the texture at the current mouse position and sets a new knitpaint
   *
   * @param setKnitpaint
   */
  private applyTexture(setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void): void {
    // Find start index
    const canvasCoordinates = this.getCanvasCoordinates();
    const startIndex = KnitpaintCanvasUtils.getIndexAtCoordinates(canvasCoordinates.x, canvasCoordinates.y, this.knitpaint.width);

    // Only continue if index and current texture is valid
    const texture = this.texture;
    if ((!startIndex && startIndex !== 0) || !texture) {
      return;
    }

    // Apply pixel by pixel
    let knitpaint = this.knitpaint;
    const textureNumbers = texture.getColorNumbers();
    for (let x = 0; x < texture.width; x++) {
      for (let y = 0; y < texture.height; y++) {
        const knitpaintIndex = startIndex + y * knitpaint.width + x;
        const textureIndex = y * texture.width + x;
        knitpaint = knitpaint.setColorNumber(knitpaintIndex, textureNumbers[textureIndex]);
      }
    }

    // Set new knitpaint
    setKnitpaint(knitpaint);
  }

  /**
   * Returns the canvas coordinates needed for drawing the texture
   */
  private getCanvasCoordinates(): SVGPoint {
    // Transform mouse position into canvas coordinates
    const mouseTransformed = this.mousePosition.matrixTransform(this.transform.inverse());

    // The actual position should be in the center
    const x = Math.floor(mouseTransformed.x - this.texture.width / 2);
    const y = Math.floor(mouseTransformed.y - this.texture.height / 2);

    // Only continue if texture is on the canvas
    if (x < 0 || x  > this.knitpaint.width - this.texture.width
      || y < 0 || y > this.knitpaint.height - this.texture.height) {
      return null;
    }
    return KnitpaintCanvasUtils.createSVGPoint(x, y);
  }
}
