import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  Type,
  ViewChild
} from '@angular/core';
import { Knitpaint } from '../knitpaint';
import { KnitpaintTool } from './knitpaint-tool';
import { knitpaintTools } from './knitpaint-tools';
import { KnitpaintCanvasUtils } from './knitpaint-canvas-utils';



@Component({
  selector: 'app-knitpaint-canvas',
  templateUrl: './knitpaint-canvas.component.html',
  styleUrls: ['./knitpaint-canvas.component.scss'],
  providers: knitpaintTools
})
export class KnitpaintCanvasComponent implements AfterViewInit, OnChanges {

  // Knitpaint in- and output
  @Input() knitpaint: Knitpaint;
  @Output() readonly knitpaintChanged: EventEmitter<Knitpaint> = new EventEmitter<Knitpaint>();

  // Current view transformation
  private transform: SVGMatrix;

  // Reference to the canvas and its rendering context
  @ViewChild('canvas') private canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;

  // Available and active tools
  private availableTools: KnitpaintTool[] = [];
  private activeTools: KnitpaintTool[] = [];

  // Helpers for rendering
  private frameRequested = false;
  private knitpaintImage: HTMLCanvasElement;

  constructor(injector: Injector) {
    for (const knitpaintTool of knitpaintTools) {
      this.availableTools.push(injector.get(knitpaintTool));
    }
  }

  /**
   * Prepares the canvas
   */
  ngAfterViewInit() {
    // Get a reference to the canvas context
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Reset transformations
    this.resetTransform();

    // Render
    this.requestRender();
  }

  /**
   * Updates cached values and notifies tools whenever inputs change
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    // Update knitpaint
    if (changes['knitpaint'] && this.knitpaint) {
      this.setKnitpaint(this.knitpaint, false);
    }
  }

  /**
   * Sets a new knitpaint object and makes sure that tools are informed
   *
   * @param knitpaint
   * Knitpaint to be set
   *
   * @param triggerChanged
   * Set to false to avoid triggering the knitpaintChanged Event
   */
  private setKnitpaint(knitpaint: Knitpaint, triggerChanged?: boolean) {
    // Set new knitpaint
    this.knitpaint = knitpaint;

    // Read the image
    this.knitpaintImage = knitpaint.getImage();

    // Notify tools about the change
    for (const tool of this.activeTools) {
      if (tool.knitpaintAvailable) {
        tool.knitpaintAvailable(this.knitpaint);
      }
    }

    // Render
    this.requestRender();

    // Notify others
    if (typeof triggerChanged === 'undefined' || triggerChanged) {
      this.knitpaintChanged.emit(this.knitpaint);
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
    this.requestRender();
  }

  /**
   * Returns a list of available tools
   */
  public getAvailableTools(): KnitpaintTool[] {
    return this.availableTools.slice();
  }

  /**
   * Returns a list of activated tools
   */
  public getActiveTools(): KnitpaintTool[] {
    return this.activeTools.slice();
  }

  /**
   * Returns the tool with the provided class
   *
   * @param toolClass
   */
  public getTool<T>(toolClass: Type<T>): T {
    return <any>this.availableTools.find((tool) => tool instanceof toolClass);
  }

  /**
   * Sets a new set of tools and calls the appropriate load and unload methods
   *
   * @param tools
   */
  public activateTools(tools?: KnitpaintTool[]) {
    const prevTools = this.activeTools || [];
    const currTools = tools || [];
    let needsRender = false;

    // Unload old tools
    for (const prevTool of prevTools) {
      if (currTools.indexOf(prevTool) === -1 && prevTool.unload) {
        if (prevTool.render) {
          needsRender = true;
        }
        prevTool.unload();
      }
    }

    // Load new tools
    for (const currTool of currTools) {
      if (prevTools.indexOf(currTool) === -1) {
        if (currTool.load) {
          currTool.load(
            this.canvas.nativeElement,
            () => this.requestRender(),
            (knitpaint: Knitpaint, triggerChange?: boolean) => this.setKnitpaint(knitpaint, triggerChange),
            (transform: SVGMatrix) => this.setTransform(transform));
        }
        if (currTool.transformAvailable) {
          currTool.transformAvailable(this.transform);
        }
        if (currTool.knitpaintAvailable) {
          currTool.knitpaintAvailable(this.knitpaint);
        }
        if (currTool.render) {
          needsRender = true;
        }
      }
    }

    // Update list of tools
    this.activeTools = currTools;

    // Render to clean paintings from old tools and allow new tools to draw
    if (needsRender) {
      this.requestRender();
    }
  }

  /**
   * Resets the view transformation to be centered and fit the canvas
   */
  public resetTransform() {
    const canvasWidth = this.canvas.nativeElement.offsetWidth;
    const canvasHeight = this.canvas.nativeElement.offsetHeight;
    const knitpaintWidth = this.knitpaint.width;
    const knitpaintHeight = this.knitpaint.height;
    this.setTransform(KnitpaintCanvasUtils.createResetSVGMatrix(canvasWidth, canvasHeight, knitpaintWidth, knitpaintHeight));
  }

  /**
   * Requests to render the canvas when the browser is ready for a new frame
   */
  private requestRender() {
    if (!this.frameRequested) {
      this.frameRequested = true;
      window.requestAnimationFrame(() => {
        this.frameRequested = false;
        this.render();
      });
    }
  }

  /**
   * Renders the canvas with the knitpaint and optionally the grid
   */
  private render() {
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
    this.ctx.drawImage(this.knitpaintImage, 0, 0);
    this.ctx.restore();

    // Allow the active tools to render something
    for (const tool of this.activeTools) {
      if (tool.render) {
        tool.render(this.ctx, this.transform);
      }
    }
  }

}
