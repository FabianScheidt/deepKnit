import { Component, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { Color, Knitpaint } from '../knitpaint';
import * as _ from 'lodash';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit, OnDestroy {

  @Input() selectedColorNumber = 0;
  @Output() selectedColorNumberChange: EventEmitter<number> = new EventEmitter<number>();
  colorNumbers = _.range(0, 256);
  private destroyed: Subject<boolean> = new Subject();

  constructor(private ngZone: NgZone) { }

  ngOnInit() {
    // Allow selection of colors using the number keys 0-9
    this.ngZone.runOutsideAngular(() => {
      fromEvent(document, 'keypress')
        .pipe(takeUntil(this.destroyed))
        .subscribe((event: KeyboardEvent) => {
          const keyCode = event.keyCode;
          if (keyCode >= 48 && keyCode <= 57) {
            this.ngZone.run(() => {
              this.selectColor(keyCode - 48);
            });
          }
        });
    });
  }

  ngOnDestroy() {
    this.destroyed.next(true);
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
  public getTextColorStr(colorNumber: number) {
    const color: Color = Knitpaint.COLOR_TABLE[colorNumber];
    const brightness = ((color[0] * 299) + (color[1] * 587) + (color[2] * 114)) / 1000;
    return brightness > 130 ? '#000000' : '#ffffff';
  }

  /**
   * Returns the tooltip text for the provided color number
   *
   * @param colorNumber
   */
  public getTooltipText(colorNumber: number) {
    return 'No. ' + colorNumber + ': ' + Knitpaint.COLOR_LABELS[colorNumber];
  }
}
