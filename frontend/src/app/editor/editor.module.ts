import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { SetupComponent } from './setup/setup.component';
import { PatternsComponent } from './patterns/patterns.component';
import { AssemblyComponent } from './assembly/assembly.component';
import { NavigationComponent } from './navigation/navigation.component';
import { EditorRoutingModule } from './editor-routing.module';

@NgModule({
  imports: [
    CommonModule,
    EditorRoutingModule
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
