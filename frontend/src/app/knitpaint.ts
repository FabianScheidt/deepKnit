import { COLOR_TABLE, COLOR_LABELS } from './knitpaint-constants';

export type Color = [number, number, number];

export class Knitpaint {
  public static readonly COLOR_TABLE: Color[] = <Color[]>COLOR_TABLE;
  public static readonly COLOR_LABELS: string[] = COLOR_LABELS;

  public readonly data: ArrayBufferLike;
  public readonly width;
  public get height(): number {
    return Math.ceil(this.data.byteLength / this.width);
  }

  /**
   * Returns a string representing the color information of the provided color number
   *
   * @param colorNumber
   */
  public static getColorString(colorNumber: number): string {
    const color: Color = Knitpaint.COLOR_TABLE[colorNumber];
    return 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
  }

  /**
   * Returns a contrast color for the provided color number
   * From this W3C document: http://www.w3.org/TR/AERT#color-contrast
   *
   * Color brightness is determined by the following formula:
   * ((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000
   * @param colorNumber
   */
  public static getContrastColorString(colorNumber: number): string {
    const color: Color = Knitpaint.COLOR_TABLE[colorNumber];
    const brightness = ((color[0] * 299) + (color[1] * 587) + (color[2] * 114)) / 1000;
    return brightness > 130 ? '#000000' : '#ffffff';
  }

  /**
   * Returns the label text for the provided color number
   *
   * @param colorNumber
   */
  public static getColorLabel(colorNumber: number): string {
    return 'No. ' + colorNumber + ': ' + Knitpaint.COLOR_LABELS[colorNumber];
  }

  /**
   * Creates a new Knitpaint instance from a serializable representation by base64 decoding the data
   *
   * @param json
   */
  public static fromJSON(json: any) {
    const binaryData = atob(json.data);
    const data = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++)        {
      data[i] = binaryData.charCodeAt(i);
    }
    const width = parseInt(json.width, 10);
    return new Knitpaint(data.buffer, width);
  }

  /**
   * Creates a new Knitpaint object from an array buffer
   * @param data
   * @param width
   */
  constructor(data: ArrayBufferLike, width: number) {
    this.data = data;
    this.width = width;
  }

  /**
   * Returns a serializable representation of the knitpaint by base64 encoding the data
   */
  public toJSON(): any {
    const binaryData = new Uint8Array(this.data).reduce((data, byte) => data + String.fromCharCode(byte), '');
    const base64Data = btoa(binaryData);
    return {
      width: this.width,
      data: base64Data
    };
  }

  /**
   * Changes the color number at an index and returns a copy of the knitpaint
   *
   * @param index
   * @param colorNumber
   */
  public setColorNumber(index: number, colorNumber: number): Knitpaint {
    if ((!index && index !== 0) || index < 0 || index >= this.data.byteLength) {
      return;
    }
    const copy = this.data.slice(0, this.data.byteLength);
    const uint: Uint8Array = new Uint8Array(copy);
    uint.fill(colorNumber, index, index + 1);
    return new Knitpaint(copy, this.width);
  }

  /**
   * Returns the color number for each byte in the data
   */
  public getColorNumbers(): number[] {
    const dataInt = new Uint8Array(this.data);
    return Array.from(dataInt);
  }

  /**
   * Returns the colors of each byte in the data
   */
  public getColors(): Color[] {
    const colorNumbers = this.getColorNumbers();
    return colorNumbers.map((colorNumber: number) => Knitpaint.COLOR_TABLE[colorNumber]);
  }

  /**
   * Returns a canvas containing a colored representation
   */
  public getImage(): HTMLCanvasElement {
    const data = new Uint8Array(this.data);
    const pixelData = Array(this.data.byteLength * 4);
    for (let i = 0; i < data.byteLength; i++) {
      const color = Knitpaint.COLOR_TABLE[data[i]];
      pixelData[i * 4] = color[0];
      pixelData[i * 4 + 1] = color[1];
      pixelData[i * 4 + 2] = color[2];
      pixelData[i * 4 + 3] = 255;
    }
    const clampedArray = new Uint8ClampedArray(pixelData);
    const imageData =  new ImageData(clampedArray, this.width, this.height);
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = this.width;
    imageCanvas.height = this.height;
    imageCanvas.getContext('2d').putImageData(imageData, 0, 0);
    return imageCanvas;
  }
}
