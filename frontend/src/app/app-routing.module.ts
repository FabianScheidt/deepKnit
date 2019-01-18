import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';
import { ColorListComponent } from './color-list/color-list.component';
import { CanvasTesterComponent } from './canvas-tester/canvas-tester.component';

const routes: Routes = [
  {
    path: '',
    component: DesignIdeasComponent
  },
  {
    path: 'color-list',
    component: ColorListComponent
  },
  {
    path: 'canvas-tester',
    component: CanvasTesterComponent
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
