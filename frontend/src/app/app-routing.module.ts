import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';

const routes: Routes = [
  {
    path: '',
    component: DesignIdeasComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
