import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnitpaintCanvasComponent } from './knitpaint-canvas.component';
import { TooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [
    CommonModule,
    TooltipModule
  ],
  declarations: [
    KnitpaintCanvasComponent
  ],
  exports: [
    KnitpaintCanvasComponent
  ]
})
export class KnitpaintCanvasModule { }
