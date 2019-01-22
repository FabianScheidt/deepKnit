import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipOutletComponent } from './tooltip-outlet/tooltip-outlet.component';
import { TooltipDirective } from './tooltip.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    TooltipOutletComponent,
    TooltipDirective
  ],
  exports: [
    TooltipOutletComponent,
    TooltipDirective
  ]
})
export class TooltipModule { }
