import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ColorPickerComponent } from './design-ideas/color-picker/color-picker.component';
import { FormsModule } from '@angular/forms';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';
import { TooltipModule } from './tooltip/tooltip.module';
import { KnitpaintCanvasModule } from './knitpaint-canvas/knitpaint-canvas.module';

declare var Hammer: any;

export class CustomHammerConfig extends HammerGestureConfig {
  buildHammer(element: HTMLElement) {
    return new Hammer(element, {
      touchAction: 'pan-x',
    });
  }
}
@NgModule({
  declarations: [
    AppComponent,
    ColorPickerComponent,
    DesignIdeasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    TooltipModule,
    KnitpaintCanvasModule
  ],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: CustomHammerConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
