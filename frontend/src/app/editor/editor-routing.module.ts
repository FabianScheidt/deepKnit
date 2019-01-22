import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditorComponent } from './editor.component';
import { SetupComponent } from './setup/setup.component';
import { PatternsComponent } from './patterns/patterns.component';
import { AssemblyComponent } from './assembly/assembly.component';

const routes: Routes = [
  {
    path: '',
    component: EditorComponent,
    children: [
      {
        path: '',
        redirectTo: 'setup'
      },
      {
        path: 'setup',
        component: SetupComponent
      },
      {
        path: 'patterns',
        component: PatternsComponent
      },
      {
        path: 'assembly',
        component: AssemblyComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorRoutingModule { }
