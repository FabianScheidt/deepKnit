import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { SetupComponent } from './setup/setup.component';
import { PatternsComponent } from './patterns/patterns.component';
import { AssemblyComponent } from './assembly/assembly.component';
import { NavigationComponent } from './navigation/navigation.component';
import { EditorRoutingModule } from './editor-routing.module';
import { KnitpaintCanvasModule } from '../knitpaint-canvas/knitpaint-canvas.module';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { TooltipModule } from '../tooltip/tooltip.module';
import { ToolbarToolsComponent } from './toolbar/toolbar-tools/toolbar-tools.component';
import { ToolbarViewComponent } from './toolbar/toolbar-view/toolbar-view.component';
import { ToolbarColorComponent } from './toolbar/toolbar-color/toolbar-color.component';

@NgModule({
  imports: [
    CommonModule,
    EditorRoutingModule,
    KnitpaintCanvasModule,
    TooltipModule
  ],
  declarations: [
    EditorComponent,
    SetupComponent,
    PatternsComponent,
    AssemblyComponent,
    NavigationComponent,
    ToolbarComponent,
    ToolbarToolsComponent,
    ToolbarViewComponent,
    ToolbarColorComponent
  ]
})
export class EditorModule { }
