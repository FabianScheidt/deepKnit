import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './toolbar.component';
import { ToolbarToolsComponent } from './toolbar-tools/toolbar-tools.component';
import { ToolbarViewComponent } from './toolbar-view/toolbar-view.component';
import { ToolbarColorComponent } from './toolbar-color/toolbar-color.component';
import { UtilsModule } from '../utils/utils.module';
import { MatDialogModule } from '@angular/material';
import { ColorPickerModule } from '../color-picker/color-picker.module';
import { TooltipModule } from '../../tooltip/tooltip.module';
import { MatomoModule } from 'ngx-matomo';

@NgModule({
  declarations: [
    ToolbarComponent,
    ToolbarToolsComponent,
    ToolbarViewComponent,
    ToolbarColorComponent
  ],
  imports: [
    CommonModule,
    UtilsModule,
    TooltipModule,
    ColorPickerModule,
    MatDialogModule,
    MatomoModule
  ],
  exports: [
    ToolbarComponent
  ]
})
export class ToolbarModule { }
