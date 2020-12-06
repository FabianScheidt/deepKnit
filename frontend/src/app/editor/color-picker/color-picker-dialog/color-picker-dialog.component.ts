import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-color-picker-dialog',
  templateUrl: './color-picker-dialog.component.html',
  styleUrls: ['./color-picker-dialog.component.scss']
})
export class ColorPickerDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ColorPickerDialogComponent>) { }

  ngOnInit() {
  }

  public pickColor(colorNumber: number) {
    this.dialogRef.close(colorNumber);
  }

}
