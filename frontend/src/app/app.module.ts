import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from './tooltip/tooltip.module';
import { KnitpaintCanvasModule } from './knitpaint-canvas/knitpaint-canvas.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    TooltipModule,
    KnitpaintCanvasModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
