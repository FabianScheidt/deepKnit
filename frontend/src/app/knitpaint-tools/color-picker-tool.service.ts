import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { KnitpaintTool } from './knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class ColorPickerTool extends AbstractKnitpaintTool implements KnitpaintTool {

  name = 'Color Picker';
  private readonly colorPickedSubject: Subject<number> = new Subject<number>();
  public readonly colorPicked: Observable<number> = this.colorPickedSubject.asObservable();

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.attachPickerEvents(canvas);
  }

  private attachPickerEvents(canvas: HTMLCanvasElement) {
    fromEvent(canvas, 'click').pipe(takeUntil(this.unloadSubject)).subscribe((e: MouseEvent) => {
      const index = KnitpaintCanvasUtils.getIndexAtCoordinates(e.offsetX, e.offsetY, this.knitpaintWidth, this.transform.inverse());
      if (index === 0 || (index && index < this.knitpaintColorNumbers.length)) {
        const colorNumber = this.knitpaintColorNumbers[index];
        this.colorPickedSubject.next(colorNumber);
      }
    });
  }
}
