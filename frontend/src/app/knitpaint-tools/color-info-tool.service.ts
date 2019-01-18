import { Injectable } from '@angular/core';
import { KnitpaintTool } from './knitpaint-tool';
import { Knitpaint } from '../knitpaint';
import { TooltipService } from '../tooltip.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ColorInfoTool implements KnitpaintTool {

  public name = 'Color Info';
  private knitpaint: Knitpaint;
  private readonly unloadSubject: Subject<void> = new Subject<void>();

  constructor(private tooltipService: TooltipService) { }

  load(canvas: HTMLCanvasElement, requestRender: () => void, setTransform: (transform: SVGMatrix) => void): void {
    console.log('Loaded ColorInfoTool!');
  }

  knitpaintAvailable(knitpaint: Knitpaint): void {
    this.knitpaint = knitpaint;
  }

  unload(): void {
    this.knitpaint = null;
    this.unloadSubject.next();
  }
}
