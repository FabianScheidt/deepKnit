import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TapClickDirective } from './tap-click.directive';

@NgModule({
  declarations: [
    TapClickDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TapClickDirective
  ]
})
export class UtilsModule { }
