import { Knitpaint } from '../knitpaint';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export abstract class AbstractKnitpaintTool {
  protected knitpaint: Knitpaint;
  protected knitpaintWidth: number;
  protected knitpaintHeight: number;
  protected knitpaintColorNumbers: number[];
  protected transform: SVGMatrix;
  protected readonly knitpaintChanged: Subject<void> = new Subject<void>();
  protected readonly unloadSubject: Subject<void> = new Subject<void>();

  /**
   * Updates the cached knitpaint and also caches all its values
   *
   * @param knitpaint
   */
  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaintChanged.next();
    this.knitpaint = knitpaint;
    knitpaint.width
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((width: number) => this.knitpaintWidth = width);
    knitpaint.height
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((height: number) => this.knitpaintHeight = height);
    knitpaint.getColorNumbers()
      .pipe(takeUntil(this.knitpaintChanged), takeUntil(this.unloadSubject))
      .subscribe((colorNumbers: number[]) => this.knitpaintColorNumbers = colorNumbers);
  }

  /**
   * Updates the cached transform
   *
   * @param transform
   */
  transformAvailable(transform: SVGMatrix): void {
    this.transform = transform;
  }

  /**
   * Calls the unload subject and cleans up all cached values
   */
  unload(): void {
    this.unloadSubject.next();
    delete this.knitpaint;
    delete this.knitpaintWidth;
    delete this.knitpaintHeight;
    delete this.knitpaintColorNumbers;
    delete this.transform;
  }
}
