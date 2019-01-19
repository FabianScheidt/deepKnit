import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { COLOR_TABLE, COLOR_LABELS } from './knitpaint-constants';

export type Color = [number, number, number];

export class Knitpaint {
  public static readonly COLOR_TABLE: Color[] = <Color[]>COLOR_TABLE;
  public static readonly COLOR_LABELS: string[] = COLOR_LABELS;

  public readonly data: BehaviorSubject<ArrayBufferLike> = new BehaviorSubject<ArrayBufferLike>(new ArrayBuffer(0));
  public readonly width: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public readonly height: Observable<number> = combineLatest(this.data, this.width).pipe(
    map(([data, width]) => Math.ceil(data.byteLength / width)),
    distinctUntilChanged()
  );

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
   * Creates a new Knitpaint object from a file blob or array buffer
   * @param data
   * @param width
   */
  constructor(data?: Blob | ArrayBufferLike, width?: number) {
    if (data) {
      this.setData(data);
    }
    if (width) {
      this.width.next(width);
    }
  }

  /**
   * Sets new data from either a file blob or array buffer
   *
   * @param data
   */
  public setData(data: Blob | ArrayBufferLike): void {
    if (data instanceof Blob) {
      this.setDataFromBlob(data);
    } else {
      this.data.next(data);
    }
  }

  /**
   * Reads a file blob and sets the knitpaint data from it
   *
   * @param blob
   */
  private setDataFromBlob(blob: Blob): void {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result: ArrayBuffer = fileReader.result;
      this.data.next(result);
    };
    fileReader.onerror = (err) => {
      this.data.error(err);
    };
    fileReader.readAsArrayBuffer(blob);
  }

  /**
   * Changes the color number at an index
   *
   * @param index
   * @param colorNumber
   */
  public setColorNumber(index: number, colorNumber: number) {
    if ((!index && index !== 0) || index < 0 || index >= this.data.getValue().byteLength) {
      return;
    }
    const uint: Uint8Array = new Uint8Array(this.data.getValue());
    uint.fill(colorNumber, index, index + 1);
    this.data.next(this.data.getValue());
  }

  /**
   * Returns the color number for each byte in the data
   */
  public getColorNumbers(): Observable<number[]> {
    return this.data.pipe(map((data: ArrayBuffer) => {
      const dataInt = new Uint8Array(data);
      return Array.from(dataInt);
    }));
  }

  /**
   * Returns the colors of each byte in the data
   */
  public getColors(): Observable<Color[]> {
    return this.getColorNumbers().pipe(
      map((colorNumbers: number[]) => {
        return colorNumbers.map((colorNumber: number) => Knitpaint.COLOR_TABLE[colorNumber]);
      }
    ));
  }

  /**
   * Returns a canvas containing a colored representation
   */
  public getImage(): Observable<HTMLCanvasElement> {
    return this.getColors().pipe(
      map((colors: Color[]) => {
        const width = this.width.getValue();
        const height = Math.ceil(colors.length / width);
        const pixelData = Array(width * height * 4);
        for (let i = 0; i < colors.length; i++) {
          const x = i % width;
          const y = Math.floor(i / width);
          const index = (y * width + x) * 4;
          pixelData[index] = colors[i][0];
          pixelData[index + 1] = colors[i][1];
          pixelData[index + 2] = colors[i][2];
          pixelData[index + 3] = 255;
        }
        const clampedArray = new Uint8ClampedArray(pixelData);
        const imageData =  new ImageData(clampedArray, width, height);
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = width;
        imageCanvas.height = height;
        imageCanvas.getContext('2d').putImageData(imageData, 0, 0);
        return imageCanvas;
      })
    );
  }
}
