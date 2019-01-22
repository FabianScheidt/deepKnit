import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';

const routes: Routes = [
  {
    path: '',
    component: DesignIdeasComponent
  },
  {
    path: '',
    loadChildren: './dev/dev.module#DevModule'
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
