import { COLOR_TABLE, COLOR_LABELS } from './knitpaint-constants';
import * as _ from 'lodash';
import { KnitpaintCanvasUtils } from './knitpaint-canvas/knitpaint-canvas-utils';

export type Color = [number, number, number];

export class Knitpaint {
  public static readonly COLOR_TABLE: Color[] = <Color[]>COLOR_TABLE;
  public static readonly COLOR_LABELS: string[] = COLOR_LABELS;

  public readonly data: ArrayBufferLike;
  public readonly width;
  public readonly syntax_error;
  public readonly knit_error;
  public readonly knit_warning;
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
    return new Knitpaint(data.buffer, width, json.syntax_error, json.knit_error, json.knit_warning);
  }

  /**
   * Creates a new Knitpaint object from an array buffer
   * @param data
   * @param width
   * @param syntax_error
   * @param knit_error
   * @param knit_warning
   */
  constructor(data: ArrayBufferLike, width: number, syntax_error?: boolean, knit_error?: boolean, knit_warning?: boolean) {
    this.data = data;
    this.width = width;
    this.syntax_error = syntax_error;
    this.knit_error = knit_error;
    this.knit_warning = knit_warning;
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
   * Returns a resized knitpaint
   *
   * @param width
   * @param height
   */
  public resize(width: number, height: number): Knitpaint {
    const uint8Array = new Uint8Array(this.data);
    const array = Array.from(uint8Array);
    let lines = _.chunk(array, this.width);

    // Remove excess lines
    if (height < this.height) {
      lines = lines.slice(0, height);
    }
    // Remove excess columns
    if (width < this.width) {
      lines = lines.map((line) => line.slice(0, width));
    }
    // Pad columns
    if (width > this.width) {
      lines = lines.map((line) => line.concat(Array(width - this.width).fill(0)));
    }
    // Pad lines
    if (height > this.height) {
      lines = lines.concat(Array(height - this.height).fill(Array(width).fill(0)));
    }

    const newArray = _.flatten(lines);
    const newUint8Array = Uint8Array.from(newArray);
    return new Knitpaint(newUint8Array.buffer, width);
  }

  /**
   * Creates new knitpaint sliced from the current one
   *
   * @param x
   * @param y
   * @param width
   * @param height
   */
  public slice(x: number, y: number, width: number, height: number): Knitpaint {
    const data = new Uint8Array(this.data);
    const res = new Uint8Array(width * height);
    for (let row = 0; row < height; row++) {
      const srcStartIndex = (row + y) * this.width + x;
      const dstStartIndex = row * width;
      res.set(data.slice(srcStartIndex, srcStartIndex + width), dstStartIndex);
    }
    return new Knitpaint(res.buffer, width);
  }

  /**
   * Creates new knitpaint that is repeated in x and y direction
   *
   * @param numX
   * @param numY
   */
  public repeat(numX: number, numY: number): Knitpaint {
    let repeated: Knitpaint = this;
    if (numX > 1) {
      const data = new Uint8Array(repeated.data);
      const res = new Uint8Array(data.byteLength * numX);
      for (let y = 0; y < repeated.height; y++) {
        const row = data.subarray(y * repeated.width, (y + 1) * repeated.width);
        for (let i = 0; i < numX; i++) {
          res.set(row, (y * numX + i) * repeated.width);
        }
      }
      repeated = new Knitpaint(res.buffer, repeated.width * numX);
    }
    if (numY > 1) {
      const data = new Uint8Array(repeated.data);
      const res = new Uint8Array(data.byteLength * numY);
      for (let i = 0; i < numY; i++) {
        res.set(data, i * data.byteLength);
      }
      repeated = new Knitpaint(res.buffer, repeated.width);
    }
    return repeated;
  }

  /**
   * Repeats a pattern to specified dimensions.
   * The original pattern is placed in the center and surrounded with repetitions.
   *
   * @param width
   * @param height
   */
  public repeatToSize(width: number, height: number): Knitpaint {
    let repeatX = Math.ceil(width / this.width);
    repeatX = repeatX % 2 === 0 ? repeatX + 1 : repeatX;
    let repeatY = Math.ceil(height / this.height);
    repeatY = repeatY % 2 === 0 ? repeatY + 1 : repeatY;
    const offsetX = Math.floor((repeatX * this.width - width) / 2);
    const offsetY = Math.floor((repeatY * this.height - height) / 2);
    const repeated = this.repeat(repeatX, repeatY);
    console.log([repeatX * this.width, repeatY * this.height], [width, height], [offsetX, offsetY]);
    return repeated.slice(offsetX, offsetY, width, height);
  }

  /**
   * Creates a new knitpaint that can be flipped in x or y direction
   *
   * @param flipX
   * @param flipY
   */
  public flip(flipX: boolean, flipY: boolean): Knitpaint {
    const data = new Uint8Array(this.data);
    if (flipX && flipY) {
      return new Knitpaint(data.slice(0, this.data.byteLength).reverse().buffer, this.width);
    }
    if (flipX) {
      const res = new Uint8Array(data.byteLength);
      for (let y = 0; y < this.height; y++) {
        const startIndex = y * this.width;
        res.set(data.slice(startIndex, startIndex + this.width).reverse(), startIndex);
      }
      return new Knitpaint(res, this.width);
    }
    if (flipY) {
      const res = new Uint8Array(data.byteLength);
      for (let y = 0; y < this.height; y++) {
        const srcStartIndex = y * this.width;
        const dstStartIndex = (this.height - y - 1) * this.width;
        res.set(data.slice(srcStartIndex, srcStartIndex + this.width), dstStartIndex);
      }
      return new Knitpaint(res, this.width);
    }
    return this;
  }

  /**
   * Creates a new knitpaint whose front- and back stitches are inverted
   */
  public invert(): Knitpaint {
    const lut = _.range(0, 256);
    lut[1] = 2; lut[2] = 1;
    lut[7] = 9; lut[9] = 7;
    lut[6] = 8; lut[8] = 6;
    lut[11] = 12; lut[12] = 11;
    lut[40] = 50; lut[50] = 40;
    lut[106] = 108; lut[108] = 106;
    lut[107] = 109; lut[109] = 107;
    lut[116] = 117; lut[117] = 116;
    return this.applyLut(lut);
  }

  /**
   * Creates a new knitpaint by applying a lookup table to each color number
   *
   * @param lut
   */
  public applyLut(lut: number[]): Knitpaint {
    const data = new Uint8Array(this.data);
    const newData = data.map((colorNumber) => lut[colorNumber]);
    return new Knitpaint(newData, this.width);
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
   * Copies the content of another knitpaint with an optional offset
   *
   * @param other
   * @param offsetX
   * @param offsetY
   */
  public applyOther(other: Knitpaint, offsetX?: number, offsetY?: number) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    // Find start index
    const startIndex = KnitpaintCanvasUtils.getIndexAtCoordinates(offsetX, offsetY, this.width);

    // Only continue if index and current texture is valid
    if ((!startIndex && startIndex !== 0) || !other) {
      return;
    }

    // Apply pixel by pixel
    let knitpaint: Knitpaint = this;
    const otherNumbers = other.getColorNumbers();
    for (let x = 0; x < other.width; x++) {
      for (let y = 0; y < other.height; y++) {
        const knitpaintIndex = startIndex + y * knitpaint.width + x;
        const textureIndex = y * other.width + x;
        knitpaint = knitpaint.setColorNumber(knitpaintIndex, otherNumbers[textureIndex]);
      }
    }

    // Return new knitpaint
    return knitpaint;
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
