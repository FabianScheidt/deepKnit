import { Knitpaint } from '../knitpaint';
import { Subject } from 'rxjs';

export abstract class AbstractKnitpaintTool {
  protected knitpaint: Knitpaint;
  protected transform: SVGMatrix;
  protected readonly unloadSubject: Subject<void> = new Subject<void>();

  /**
   * Updates the cached knitpaint and also caches all its values
   *
   * @param knitpaint
   */
  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaint = knitpaint;
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
    delete this.transform;
  }
}
