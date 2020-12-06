import { Component, OnInit } from '@angular/core';
import { Knitpaint } from '../../knitpaint';
import * as _ from 'lodash';

@Component({
  selector: 'app-color-list',
  templateUrl: './color-list.component.html',
  styleUrls: ['./color-list.component.scss']
})
export class ColorListComponent implements OnInit {
  colorNumbers = _.range(0, 256);

  constructor() {
    console.log('!!!!');
  }

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
  public getColorLabel(colorNumber: number) {
    return Knitpaint.getColorLabel(colorNumber);
  }

}
