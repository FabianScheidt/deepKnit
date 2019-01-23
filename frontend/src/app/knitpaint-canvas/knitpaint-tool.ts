import { Knitpaint } from '../knitpaint';

export interface KnitpaintTool {

  /**
   * A tool should have a cleartext name
   */
  readonly name: string;

  /**
   * The load method is called when the tool is selected and loaded.
   *
   * @param canvas
   * Reference to the canvas node. This can be used to attach events to it.
   *
   * @param requestRender
   * This method should be called when the tools requires the canvas to render.
   *
   * @param setKnitpaint
   * This method can be called to set a new knitpaint. triggerChange can be set to false to avoid that the knitpaint canvas triggers the
   * knitpaintChanged event.
   *
   * @param setTransform
   * This method can be called to set a new view transform matrix
   */
  load?(canvas: HTMLCanvasElement,
        requestRender: () => void,
        setKnitpaint: (knitpaint: Knitpaint, triggerChange?: boolean) => void,
        setTransform: (transform: SVGMatrix) => void): void;

  /**
   * Is called when a new knitpaint object is set
   *
   * @param knitpaint
   */
  knitpaintAvailable?(knitpaint: Knitpaint): void;

  /**
   * Is called when a new view transform matrix is set
   *
   * @param transform
   */
  transformAvailable?(transform: SVGMatrix): void;

  /**
   * The render method is called after the canvas rendered the knitpaint itself. It can be used to draw tool specific overlays.
   *
   * @param ctx
   * @param transform
   */
  render?(ctx: CanvasRenderingContext2D, transform: SVGMatrix): void;

  /**
   * The unload method is called when the tool is deselected. It should detach all event listeners and clean up.
   */
  unload?(): void;
}
