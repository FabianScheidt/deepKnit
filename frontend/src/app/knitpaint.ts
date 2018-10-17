import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type Color = [number, number, number];

export class Knitpaint {
  public static readonly COLOR_TABLE: Color[] = [
    [0, 0, 0], [255, 0, 0], [0, 255, 0], [255, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255],
    [74, 137, 153], [108, 36, 144], [180, 180, 216], [255, 103, 189], [144, 108, 180], [153, 153, 153],
    [207, 144, 192], [128, 128, 255], [81, 255, 222], [82, 145, 219], [0, 124, 145], [235, 235, 36],
    [178, 118, 178], [252, 180, 108], [252, 148, 99], [252, 108, 72], [252, 216, 252], [252, 180, 252],
    [216, 144, 252], [100, 200, 200], [160, 102, 0], [235, 172, 235], [115, 115, 178], [144, 216, 72],
    [115, 178, 115], [157, 127, 1], [235, 235, 172], [216, 216, 72], [180, 180, 108], [255, 0, 160],
    [215, 195, 225], [172, 172, 235], [127, 0, 127], [216, 72, 144], [144, 108, 216], [216, 216, 252],
    [216, 180, 216], [202, 167, 225], [188, 154, 70], [174, 141, 245], [159, 127, 255], [128, 96, 255],
    [220, 118, 117], [255, 144, 144], [192, 255, 144], [252, 252, 180], [252, 252, 144], [216, 252, 72],
    [255, 144, 207], [144, 255, 192], [180, 144, 144], [253, 235, 199], [160, 255, 255], [0, 255, 255],
    [50, 233, 233], [50, 202, 233], [53, 175, 237], [0, 213, 0], [216, 108, 216], [216, 108, 180],
    [192, 96, 180], [168, 84, 180], [153, 102, 255], [255, 255, 255], [0, 160, 160], [183, 188, 188],
    [197, 174, 183], [226, 197, 178], [192, 255, 207], [144, 207, 192], [144, 216, 252], [144, 180, 252],
    [0, 112, 153], [74, 137, 153], [109, 165, 180], [144, 192, 207], [0, 102, 255], [0, 153, 255], [51, 173, 255],
    [102, 193, 255], [153, 214, 255], [133, 122, 3], [202, 40, 145], [120, 48, 156], [144, 72, 180],
    [180, 108, 216], [255, 0, 143], [125, 143, 165], [255, 102, 187], [255, 153, 210], [105, 63, 36], [127, 0, 0],
    [129, 100, 12], [250, 163, 185], [172, 235, 172], [252, 216, 108], [178, 178, 115], [127, 127, 0],
    [180, 144, 72], [180, 108, 108], [212, 149, 149], [180, 216, 216], [144, 108, 108], [255, 191, 191],
    [192, 207, 144], [255, 207, 144], [115, 178, 178], [192, 144, 207], [169, 229, 231], [216, 216, 180],
    [180, 216, 144], [191, 106, 105], [144, 216, 252], [255, 221, 173], [178, 115, 115], [216, 180, 108],
    [0, 0, 127], [170, 0, 0], [0, 150, 0], [216, 157, 73], [144, 101, 253], [251, 253, 254], [157, 90, 111],
    [129, 223, 165], [172, 172, 255], [55, 157, 127], [191, 223, 190], [221, 243, 123], [63, 110, 17],
    [185, 247, 171], [215, 219, 255], [239, 255, 103], [253, 251, 85], [222, 255, 185], [115, 171, 127],
    [254, 251, 157], [141, 199, 222], [47, 49, 251], [255, 175, 127], [251, 250, 127], [237, 175, 251],
    [254, 106, 127], [245, 157, 147], [6, 3, 240], [237, 234, 251], [234, 254, 254], [61, 159, 191], [173, 12, 235],
    [250, 167, 93], [252, 222, 239], [253, 125, 252], [239, 245, 247], [141, 199, 222], [102, 0, 138],
    [122, 103, 150], [127, 255, 255], [121, 127, 189], [95, 191, 58], [113, 135, 187], [155, 127, 223],
    [238, 206, 61], [255, 252, 248], [255, 47, 207], [168, 191, 176], [219, 190, 254], [159, 111, 158],
    [255, 253, 253], [245, 186, 95], [243, 95, 217], [205, 242, 243], [254, 223, 147], [224, 45, 255],
    [121, 127, 189], [200, 200, 200], [31, 181, 55], [115, 91, 170], [229, 111, 129], [191, 119, 253],
    [246, 219, 190], [243, 143, 127], [222, 126, 127], [224, 146, 255], [204, 95, 145], [240, 240, 240],
    [100, 157, 76], [75, 255, 75], [161, 186, 75], [64, 64, 64], [26, 236, 206], [247, 247, 103], [103, 251, 169],
    [224, 109, 255], [100, 100, 255], [255, 100, 125], [63, 227, 211], [245, 150, 100], [239, 247, 247],
    [151, 199, 111], [150, 255, 247], [20, 211, 180], [103, 127, 207], [215, 175, 173], [238, 246, 233],
    [183, 245, 252], [234, 247, 127], [186, 115, 205], [189, 90, 175], [108, 178, 129], [78, 136, 247],
    [38, 95, 100], [47, 183, 245], [100, 137, 81], [159, 253, 125], [191, 188, 164], [243, 233, 63],
    [127, 127, 223], [255, 126, 247], [170, 127, 207], [191, 250, 249], [230, 47, 253], [235, 247, 223],
    [87, 124, 127], [254, 165, 77], [6, 3, 240], [237, 234, 251], [79, 199, 95], [239, 141, 251], [106, 251, 255],
    [183, 255, 223], [98, 255, 79], [207, 91, 240], [221, 121, 169], [107, 231, 69], [102, 0, 138], [122, 103, 150],
    [178, 141, 186], [247, 236, 189], [90, 185, 252], [76, 247, 183], [156, 89, 9], [157, 189, 242], [150, 0, 0],
    [0, 175, 0], [0, 150, 0], [200, 0, 0], [110, 0, 0], [100, 100, 100], [0, 125, 0]
  ];

  public static COLOR_LABELS: string[] = [
    'Miss',
    'Front knit (jersey)',
    'Back knit (reversed jersey)',
    'Front / back knit',
    'Normal stich knit (lower) [Front stich cross(1)]',
    'Normal stich knit (upper) [Front stich cross(1)] / [Front-Back stich cross(1)]',
    'Front knit + move 1P left',
    'Front knit + move 1P right',
    'Back knit + move 1P left',
    'Back knit + move 1P right',
    'Reverse stich knit (lower) [Front-Back stich cross(1)]',
    'Front tuck',
    'Back tuck',
    'Auto yarn feeder point',
    'Normal stich knit (lower) [Front stich cross(2)]',
    'Normal stich knit (upper) [Front stich cross(2)] / [Front-Back stich cross(2)]',
    'No needle selection',
    'Front knit (with kick back process)',
    'Back knit (with kick back process)',
    '',
    'Front knit + transfer',
    'Front knit + transfer 1P left',
    'Front knit + transfer 2P left',
    'Front knit + transfer 3P left',
    'Front knit + transfer 1P right',
    'Front knit + transfer 2P right',
    'Front knit + transfer 3P right',
    'Front knit for 2nd stich (-)',
    'Back knit for 2nd stich (-)',
    'Front knit + transfer',
    'Back knit + transfer',
    'Back knit + transfer 1P left',
    'Back knit + transfer 2P left',
    'Back knit + transfer 3P left',
    'Back knit + transfer 1P right',
    'Back knit + transfer 2P right',
    'Back knit + transfer 3P right',
    'Front knit for 2nd stich (+)',
    'Back knit for 2nd stich (+)',
    'Back knit + transfer',
    'Front knit + transfer',
    'Front knit, knit + receive assistance (back) (without links process)',
    'Knit + receive assistance (front), back knit (without links process)',
    'Front knit + transfer 4P left',
    'Front knit + transfer 5P left',
    'Front knit + transfer 6P left',
    'Front knit + transfer 7P left',
    'Front knit + transfer 4P right',
    'Front knit + transfer 5P right',
    'Front knit + transfer 6P right',
    'Back knit + transfer',
    'Front knit (without links process)',
    'Back knit (without links process)',
    'Back knit + transfer 4P left',
    'Back knit + transfer 5P left',
    'Back knit + transfer 6P left',
    'Back knit + transfer 7P left',
    'Back knit + transfer 4P right',
    'Back knit + transfer 5P right',
    'Back knit + transfer 6P right',
    '',
    'Front knit + move 1P left',
    'Front knit + move 2P left',
    'Front knit + move 3P left',
    'Front knit + move 4P left',
    'Front miss + move 1P left',
    'Front miss + move 2P left',
    'Front miss + move 4P left',
    'Front knit + transfer 7P right',
    'Back knit + transfer 7P right',
    '',
    'Front knit + move 1P right',
    'Front knit + move 2P right',
    'Front knit + move 3P right',
    'Front knit + move 4P right',
    'Front miss + move 1P right',
    'Front miss + move 2P right',
    'Front miss + move 4P right',
    '', '', '',
    'Back knit + move 1P left',
    'Back knit + move 2P left',
    'Back knit + move 3P left',
    'Back knit + move 4P left',
    'Back miss + move 1P left',
    'Back miss + move 2P left',
    'Back miss + move 4P left',
    'Knit + receive assistance (front and back)',
    '', '',
    'Back knit + move 1P right',
    'Back knit + move 2P right',
    'Back knit + move 3P right',
    'Back knit + move 4P right',
    'Back miss + move 1P right',
    'Back miss + move 2P right',
    'Back miss + move 4P right',
    '',
    'Links process code + Pulldown pattern output code (255)',
    'Reverse stich knit (lower) [Front-Back stich cross(2)]',
    'Front split knit',
    'Back split knit',
    'Transfer + front knit for 2nd stich (-) + transfer',
    'Back knit + transfer (non auto-transfer)',
    '',
    'Front split knit + transfer 1P left',
    'Front split knit + transfer 1P right',
    'Back split knit + transfer 1P left',
    'Back split knit + transfer 1P right',
    '',
    'Front tuck for 2nd stich (-)',
    'Back tuck for 2nd stich (-)',
    '',
    'Front knit (out of commanded bed)(without links process)',
    'Back knit (out of commanded bed) (without links process)',
    'Front miss (with links process)',
    'Back miss (with links process)',
    'Front knit (out of commanded bed) (not intended for receive assistance)',
    'Back knit (out of commanded bed) (not intended for receive assistance)',
    'Front knit (out of commanded bed) + transfer (OP line L13: back body)',
    'Color no. 1 + Auto yarn feeder point',
    'Color no. 2 + Auto yarn feeder point',
    'Color no. 3 + Auto yarn feeder point',
    'Color no. 4 + Auto yarn feeder point',
    '',
    'Front split knit + transfer 2P left',
    'Front split knit + transfer 2P right',
    'Back split knit + transfer 2P left',
    'Back split knit + transfer 2P right',
    'Back knit (out of commanded bed) + transfer (OP Lline L13: front body)',
    'Front knit (without miss TR)',
    'Back knit (without miss TR)',
    '', '',
    'Front / back move 1 pitch left',
    'Front / back move 1 pitch right',
    '', '', '', '', '', '', '', '',
    'Front / back move 2 pitch left',
    'Front / back move 2 pitch right',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'Front knit (jersey) Knitting assist prohibition (without links process)',
    'Back knit (reversed jersey) Knitting assist prohibition (without links process)',
    '', '', '', '', '', '', '', '',
    'Front tuck (without links process)',
    'Back tuck (without links process)',
    'Front tuck for 2nd stich (without links process)',
    'Back tuck for 2nd stich (without links process)',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '',
    'Pulldown pattern shift knit code',
    '',
    'Pulldown pattern output code',
    'Pulldown pattern output code',
    'Pulldown pattern output code',
    '',
    'Pulldown pattern output code'
  ];

  public data: BehaviorSubject<ArrayBuffer> = new BehaviorSubject<ArrayBuffer>(null);

  /**
   * Creates a new Knitpaint object from a file blob or array buffer
   * @param data
   */
  constructor(data?: Blob | ArrayBuffer) {
    if (data) {
      this.setData(data);
    }
  }

  /**
   * Sets new data from either a file blob or array buffer
   *
   * @param data
   */
  public setData(data: Blob | ArrayBuffer): void {
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
}
