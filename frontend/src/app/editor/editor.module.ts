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
import { FormsModule } from '@angular/forms';
import { ApiModule } from '../api/api.module';
import { EditorStateService } from './editor-state.service';
import { EditorIoService } from './editor-io.service';
import { ProjectService } from './project.service';
import { TapClickDirective } from './tap-click.directive';
import { MatButtonModule, MatDividerModule, MatIconModule, MatInputModule, MatMenuModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EditorRoutingModule,
    ApiModule,
    KnitpaintCanvasModule,
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
    NavigationComponent,
    ToolbarComponent,
    ToolbarToolsComponent,
    ToolbarViewComponent,
    ToolbarColorComponent,
    TapClickDirective
  ],
  providers: [
    ProjectService,
    EditorStateService,
    EditorIoService
  ]
})
export class EditorModule { }
