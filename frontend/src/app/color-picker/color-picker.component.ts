import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Color, Knitpaint } from '../knitpaint';
import * as _ from 'lodash';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit {

  @Input() selectedColorNumber = 0;
  @Output() selectedColorNumberChange: EventEmitter<number> = new EventEmitter<number>();
  colorNumbers = _.range(0, 256);

  constructor() { }

  ngOnInit() {
  }

  /**
   * Marks the provided color number as selected
   *
   * @param colorNumber
   */
  public selectColor(colorNumber: number) {
    this.selectedColorNumber = colorNumber;
    this.selectedColorNumberChange.emit(colorNumber);
  }

  /**
   * Returns a string representing the color information of the provided color number
   *
   * @param colorNumber
   */
  public getBackgroundColorStr(colorNumber: number) {
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
  public getTextColorStr(colorNumber) {
    const color: Color = Knitpaint.COLOR_TABLE[colorNumber];
    const brightness = ((color[0] * 299) + (color[1] * 587) + (color[2] * 114)) / 1000;
    return brightness > 130 ? '#000000' : '#ffffff';
  }

}
