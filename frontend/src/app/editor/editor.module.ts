import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { SetupComponent } from './setup/setup.component';
import { PatternsComponent } from './patterns/patterns.component';
import { AssemblyComponent } from './assembly/assembly.component';
import { NavigationComponent } from './navigation/navigation.component';
import { EditorRoutingModule } from './editor-routing.module';
import { KnitpaintCanvasModule } from '../knitpaint-canvas/knitpaint-canvas.module';
import { TooltipModule } from '../tooltip/tooltip.module';
import { FormsModule } from '@angular/forms';
import { ApiModule } from '../api/api.module';
import { EditorStateService } from './editor-state.service';
import { EditorIoService } from './editor-io.service';
import { ProjectService } from './project.service';
import {
  MatButtonModule,
  MatDividerModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatSliderModule,
  MatSlideToggleModule
} from '@angular/material';
import { ToolbarModule } from './toolbar/toolbar.module';
import { UtilsModule } from './utils/utils.module';
import { PatternComponent } from './patterns/pattern/pattern.component';
import { PatternsBarComponent } from './patterns-bar/patterns-bar.component';
import { ToolOptionsComponent } from './assembly/tool-options/tool-options.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EditorRoutingModule,
    ApiModule,
    KnitpaintCanvasModule,
    UtilsModule,
    ToolbarModule,
    TooltipModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSliderModule,
    MatSlideToggleModule
  ],
  declarations: [
    EditorComponent,
    SetupComponent,
    PatternsComponent,
    AssemblyComponent,
    NavigationComponent,
    PatternComponent,
    PatternsBarComponent,
    ToolOptionsComponent
  ],
  providers: [
    ProjectService,
    EditorStateService,
    EditorIoService
  ]
})
export class EditorModule { }
