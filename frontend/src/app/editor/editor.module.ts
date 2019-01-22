import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { SetupComponent } from './setup/setup.component';
import { PatternsComponent } from './patterns/patterns.component';
import { AssemblyComponent } from './assembly/assembly.component';
import { NavigationComponent } from './navigation/navigation.component';
import { EditorRoutingModule } from './editor-routing.module';
import { KnitpaintCanvasModule } from '../knitpaint-canvas/knitpaint-canvas.module';

@NgModule({
  imports: [
    CommonModule,
    EditorRoutingModule,
    KnitpaintCanvasModule
  ],
  declarations: [
    EditorComponent,
    SetupComponent,
    PatternsComponent,
    AssemblyComponent,
    NavigationComponent
  ]
})
export class EditorModule { }
