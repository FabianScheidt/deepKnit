import { Injectable, NgZone } from '@angular/core';
import { KnitpaintTool } from '../knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

@Injectable()
export class VerticalSelectionTool extends AbstractKnitpaintTool implements KnitpaintTool {

  public name = 'Vertical Selection';
  public canvas: HTMLCanvasElement;
  public readonly selection: BehaviorSubject<[number, number]> = new BehaviorSubject<[number, number]>(null);

  constructor(private ngZone: NgZone) {
    super();
  }

  load(canvas: HTMLCanvasElement, requestRender: () => void): void {
    this.canvas = canvas;
    this.selection.next(null);

    // Attach events and set the cursor
    this.attachSelectionEvents(canvas);
    canvas.style.cursor = 'row-resize';

    // Render whenever the selection changes
    this.selection.subscribe(() => {
      requestRender();
    });
  }

  render(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void {
    const selection = this.selection.getValue();
    if (!selection) {
      return;
    }

    // Draw opaque white over the areas that are not selected
    ctx.save();
    ctx.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, this.knitpaint.width, selection[0] / this.knitpaint.width);
    ctx.fillRect(0, this.knitpaint.height, this.knitpaint.width, selection[1] / this.knitpaint.width - this.knitpaint.height);
    ctx.restore();
  }

  unload(): void {
    super.unload();
    this.canvas.style.cursor = '';
    delete this.canvas;
  }

  /**
   * Attaches all events needed to allow selection of rows
   */
  private attachSelectionEvents(canvas: HTMLCanvasElement) {
    this.ngZone.runOutsideAngular(() => {
      let selectionStart: SVGPoint = null;
      let moved = false;
      fromEvent(canvas, 'mousedown').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        selectionStart = KnitpaintCanvasUtils.createSVGPoint(event.offsetX, event.offsetY);
      });
      const updateSelection = (event: MouseEvent) => {
        if (selectionStart !== null) {
          const selectionEnd: SVGPoint = KnitpaintCanvasUtils.createSVGPoint(event.offsetX, event.offsetY);

          // Deselect if the mouse didn't move
          if (!moved) {
            this.selection.next(null);
            return;
          }

          // Transform canvas coordinates to knitpaint coordinates
          const selectionStartTransformed = selectionStart.matrixTransform(this.transform.inverse());
          const selectionEndTransformed = selectionEnd.matrixTransform(this.transform.inverse());

          // Find the indices of the selection based on the start and end coordinates
          const startX = 0;
          const endX = this.knitpaint.width - 0.1;
          const startY = Math.min(selectionStartTransformed.y, selectionEndTransformed.y);
          const endY = Math.max(selectionStartTransformed.y, selectionEndTransformed.y);
          const startIndex = KnitpaintCanvasUtils.getIndexAtCoordinates(startX, startY, this.knitpaint.width);
          const endIndex = KnitpaintCanvasUtils.getIndexAtCoordinates(endX, endY, this.knitpaint.width);
          const newSelection: [number, number] = [startIndex, endIndex];

          // Only emit the update if the selection actually changed
          const currentSelection = this.selection.getValue();
          if (currentSelection == null || newSelection[0] !== currentSelection[0] || newSelection[1] !== currentSelection[1]) {
            this.selection.next(newSelection);
          }
        }
      };
      fromEvent(canvas, 'mousemove').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        if (selectionStart !== null) {
          moved = true;
          updateSelection(event);
        }
      });
      fromEvent(document, 'mouseup').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
        updateSelection(event);
        selectionStart = null;
        moved = false;
      });
    });
  }
}
