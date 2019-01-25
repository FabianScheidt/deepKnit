import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Knitpaint } from '../../../knitpaint';
import * as _ from 'lodash';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit {

  colorNumbers = _.range(0, 256);
  recommendedColorNumbers = [1, 2, 4, 5, 6, 7, 10, 11, 15, 16, 100, 116, 117];
  @Output() colorPicked: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }

  /**
   * Returns a string representing the color information of the provided color number
   *
   * @param colorNumber
   */
  public getBackgroundColorStr(colorNumber: number) {
    return Knitpaint.getColorString(colorNumber);
  }

  /**
   * Returns a contrast color for the provided color number
   *
   * @param colorNumber
   */
  public getTextColorStr(colorNumber: number) {
    return Knitpaint.getContrastColorString(colorNumber);
  }

  /**
   * Returns the tooltip text for the provided color number
   *
   * @param colorNumber
   */
  public getLabelText(colorNumber: number) {
    return Knitpaint.COLOR_LABELS[colorNumber];
  }

  public pickColor(colorNumber: number) {
    this.colorPicked.emit(colorNumber);
  }

}
