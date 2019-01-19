import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { KnitpaintTool } from './knitpaint-tool';
import { takeUntil } from 'rxjs/operators';
import { Knitpaint } from '../knitpaint';
import { KnitpaintCanvasUtils } from '../knitpaint-canvas/knitpaint-canvas-utils';

@Injectable({
  providedIn: 'root'
})
export class ColorPickerTool implements KnitpaintTool {

  name = 'Color Picker';
  private readonly colorPickedSubject: Subject<number> = new Subject<number>();
  public readonly colorPicked: Observable<number> = this.colorPickedSubject.asObservable();
  private width: number;
  private colorNumbers: number[];
  private transform: SVGMatrix;
  private readonly knitpaintChanged: Subject<void> = new Subject<void>();
  private readonly unloadSubject: Subject<void> = new Subject<void>();

  constructor() { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    this.attachPickerEvents(canvas);
  }

  transformAvailable(transform: SVGMatrix): void {
    this.transform = transform;
  }

  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaintChanged.next();
    knitpaint.width
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((width: number) => this.width = width);
    knitpaint.getColorNumbers()
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((colorNumbers: number[]) => this.colorNumbers = colorNumbers);
  }

  unload(): void {
    delete this.width;
    delete this.colorNumbers;
    delete this.transform;
    this.unloadSubject.next();
  }

  private attachPickerEvents(canvas: HTMLCanvasElement) {
    fromEvent(canvas, 'click').pipe(takeUntil(this.unloadSubject)).subscribe((e: MouseEvent) => {
      const index = KnitpaintCanvasUtils.getIndexAtCoordinates(e.offsetX, e.offsetY, this.width, this.transform.inverse());
      if (index === 0 || (index && index < this.colorNumbers.length)) {
        const colorNumber = this.colorNumbers[index];
        this.colorPickedSubject.next(colorNumber);
      }
    });
  }
}
