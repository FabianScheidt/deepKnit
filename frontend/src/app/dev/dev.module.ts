import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasTesterComponent } from './canvas-tester/canvas-tester.component';
import { FormsModule } from '@angular/forms';
import { DevRoutingModule } from './dev-routing.module';
import { KnitpaintCanvasModule } from '../knitpaint-canvas/knitpaint-canvas.module';
import { TooltipModule } from '../tooltip/tooltip.module';
import { ColorListComponent } from './color-list/color-list.component';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';
import { ColorPickerComponent } from './design-ideas/color-picker/color-picker.component';
import { ApiModule } from '../api/api.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DevRoutingModule,
    ApiModule,
    KnitpaintCanvasModule,
    TooltipModule
  ],
  declarations: [
    DesignIdeasComponent,
    ColorPickerComponent,
    ColorListComponent,
    CanvasTesterComponent
  ],
  exports: [
    CanvasTesterComponent,
    ColorListComponent
  ]
})
export class DevModule { }
