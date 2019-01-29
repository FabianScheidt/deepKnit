import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Knitpaint } from '../../../knitpaint';
import { MatDialog } from '@angular/material';
import { ColorPickerDialogComponent } from '../../color-picker/color-picker-dialog/color-picker-dialog.component';
import { MatomoTracker } from 'ngx-matomo';

@Component({
  selector: 'app-toolbar-color',
  templateUrl: './toolbar-color.component.html',
  styleUrls: ['./toolbar-color.component.scss']
})
export class ToolbarColorComponent {

  @Input() activeColorNumber = 0;
  @Output() activeColorNumberChange: EventEmitter<number> = new EventEmitter<number>();

  constructor(public dialog: MatDialog, private matomoTracker: MatomoTracker) {}

  /**
   * Returns a string representation of the current color number
   */
  public getColorString(): string {
    return Knitpaint.getColorString(this.activeColorNumber);
  }

  /**
   * Retuns a contrast color to the current color number
   */
  public getContrastColorString(): string {
    return Knitpaint.getContrastColorString(this.activeColorNumber);
  }

  /**
   * Opens a dialog to pick a color
   */
  public openColorPicker() {
    const dialogRef = this.dialog.open(ColorPickerDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result || result === 0) {
        this.activeColorNumber = result;
        this.activeColorNumberChange.next(this.activeColorNumber);
        this.matomoTracker.trackEvent('color', 'picked');
      }
    });
  }

}
