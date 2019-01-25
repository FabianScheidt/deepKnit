import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { ColorPickerDialogComponent } from './color-picker-dialog/color-picker-dialog.component';
import { UtilsModule } from '../utils/utils.module';
import { MatButtonModule, MatDialogModule, MatTabsModule } from '@angular/material';
import { TooltipModule } from '../../tooltip/tooltip.module';

@NgModule({
  declarations: [
    ColorPickerComponent,
    ColorPickerDialogComponent
  ],
  entryComponents: [
    ColorPickerDialogComponent
  ],
  imports: [
    CommonModule,
    UtilsModule,
    TooltipModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule
  ]
})
export class ColorPickerModule { }
