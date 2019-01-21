import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { FormsModule } from '@angular/forms';
import { TooltipComponent } from './tooltip/tooltip.component';
import { TooltipDirective } from './tooltip.directive';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';
import { ColorListComponent } from './color-list/color-list.component';
import { KnitpaintCanvasComponent } from './knitpaint-canvas/knitpaint-canvas.component';
import { CanvasTesterComponent } from './canvas-tester/canvas-tester.component';

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
    TooltipComponent,
    TooltipDirective,
    DesignIdeasComponent,
    ColorListComponent,
    KnitpaintCanvasComponent,
    CanvasTesterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: CustomHammerConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
