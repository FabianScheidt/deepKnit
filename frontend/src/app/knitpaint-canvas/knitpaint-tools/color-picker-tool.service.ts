import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { KnitpaintTool } from '../knitpaint-tool';
import { AbstractKnitpaintTool } from './abstract-knitpaint-tool';
import { takeUntil } from 'rxjs/operators';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas-utils';

@Injectable()
export class ColorPickerTool extends AbstractKnitpaintTool implements KnitpaintTool {

  name = 'Color Picker';
  private readonly colorPickedSubject: Subject<number> = new Subject<number>();
  public readonly colorPicked: Observable<number> = this.colorPickedSubject.asObservable();

  load(canvas: HTMLCanvasElement): void {
    this.attachPickerEvents(canvas);
  }

  private attachPickerEvents(canvas: HTMLCanvasElement) {
    fromEvent(canvas, 'click').pipe(takeUntil(this.unloadSubject)).subscribe((event: MouseEvent) => {
      this.pickColorAt(event.offsetX, event.offsetY);
    });
    fromEvent(canvas, 'touchstart').pipe(takeUntil(this.unloadSubject)).subscribe((event: TouchEvent) => {
      if (event.touches.length === 1) {
        const rect = (<any>event.target).getBoundingClientRect();
        const x = event.targetTouches[0].pageX - rect.left;
        const y = event.targetTouches[0].pageY - rect.top;
        this.pickColorAt(x, y);
      }
    });
  }

  private pickColorAt(x: number, y: number) {
    const index = KnitpaintCanvasUtils.getIndexAtCoordinates(x, y, this.knitpaint.width, this.transform.inverse());
    const colorNumbers = this.knitpaint.getColorNumbers();
    if (index === 0 || (index && index < colorNumbers.length)) {
      const colorNumber = colorNumbers[index];
      this.colorPickedSubject.next(colorNumber);
    }
  }
}
