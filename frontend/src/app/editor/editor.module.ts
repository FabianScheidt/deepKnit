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
import { MatButtonModule, MatDividerModule, MatIconModule, MatInputModule, MatMenuModule } from '@angular/material';
import { ToolbarModule } from './toolbar/toolbar.module';
import { UtilsModule } from './utils/utils.module';

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
    MatDividerModule
  ],
  declarations: [
    EditorComponent,
    SetupComponent,
    PatternsComponent,
    AssemblyComponent,
    NavigationComponent
  ],
  providers: [
    ProjectService,
    EditorStateService,
    EditorIoService
  ]
})
export class EditorModule { }
