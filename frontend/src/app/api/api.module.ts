import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KnitpaintConversionService } from './knitpaint-conversion.service';
import { KnitpaintSamplingService } from './knitpaint-sampling.service';
import { PatternSamplingService } from './pattern-sampling.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [],
  providers: [
    KnitpaintConversionService,
    KnitpaintSamplingService,
    PatternSamplingService
  ]
})
export class ApiModule { }
