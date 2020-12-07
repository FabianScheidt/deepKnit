import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { KnitpaintConversionService } from './knitpaint-conversion.service';
import { PatternSamplingService } from './pattern-sampling.service';
import { ProjectLoggingService } from './project-logging.service';
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
    ProjectLoggingService
  ]
})
export class ApiModule { }
