import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KnitpaintConversionService } from './knitpaint-conversion.service';
import { PatternSamplingService } from './pattern-sampling.service';
import { KnitpaintThumbnailService } from './knitpaint-thumbnail.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [],
  providers: [
    KnitpaintConversionService,
    KnitpaintThumbnailService,
    PatternSamplingService,
  ]
})
export class ApiModule { }
