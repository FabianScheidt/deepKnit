export class KnitpaintCanvasUtils {

  // Helper element to create SVGMatrix and SVGPoint
  private static readonly svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  /**
   * Creates a identity SVGMatrix
   */
  public static createSVGMatrix(): SVGMatrix {
    return this.svg.createSVGMatrix();
  }

  /**
   * Creates a SVGPoint with the provided coordinates
   *
   * @param x
   * @param y
   */
  public static createSVGPoint(x: number, y: number): SVGPoint {
    const point = this.svg.createSVGPoint();
    point.x = x;
    point.y = y;
    return point;
  }

  /**
   * Creates a SVGPoint and transforms it with the provided matrix
   *
   * @param x
   * @param y
   * @param transform
   */
  public static createTransformedSVGPoint(x: number, y: number, transform: SVGMatrix): SVGPoint {
    const point = this.createSVGPoint(x, y);
    return point.matrixTransform(transform);
  }

  /**
   * Generates a standard view matrix based on the provided canvas and knitpaint dimensions
   *
   * @param canvasWidth
   * @param canvasHeight
   * @param knitpaintWidth
   * @param knitpaintHeight
   */
  public static createResetSVGMatrix(canvasWidth: number, canvasHeight: number, knitpaintWidth: number, knitpaintHeight: number) {
    let transform = this.createSVGMatrix();

    // Move coordinates to center
    transform = transform.translate(canvasWidth / 2, canvasHeight / 2);

    // Scale to fit
    const xScale = canvasWidth / knitpaintWidth;
    const yScale = canvasHeight / knitpaintHeight;
    const scale = Math.min(xScale, yScale);
    transform = transform.scale(scale);

    // Knitpaint flows bottom to top
    transform = transform.flipY();

    // Center knitpaint
    return transform.translate(-knitpaintWidth / 2, -knitpaintHeight / 2);
  }

  /**
   * Scales a transformation matrix around a point
   *
   * @param transform
   * @param scale
   * @param point
   */
  public static scaleAroundPoint(transform: SVGMatrix, scale: number, point: SVGPoint): SVGMatrix {
    return transform.translate(point.x, point.y).scale(scale).translate(-point.x, -point.y);
  }

  /**
   * Returns the pixel index for some coordinates. Returns null if the coordinates are outside of the width or the index would be negative.
   * The coordinates can optionally be transformed using a matrix.
   *
   * @param x
   * @param y
   * @param width
   * @param transform
   */
  public static getIndexAtCoordinates(x: number, y: number, width: number, transform?: SVGMatrix): number {
    transform = transform || this.createSVGMatrix();
    const point = this.createTransformedSVGPoint(x, y, transform);
    if (point.x >= 0 && point.x < width && point.y >= 0) {
      return Math.floor(point.y) * width + Math.floor(point.x);
    }
    return null;
  }

}
