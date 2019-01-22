import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ColorListComponent } from './color-list/color-list.component';
import { CanvasTesterComponent } from './canvas-tester/canvas-tester.component';
import { DesignIdeasComponent } from './design-ideas/design-ideas.component';

const routes: Routes = [
  {
    path: 'design-ideas',
    component: DesignIdeasComponent
  },
  {
    path: 'color-list',
    component: ColorListComponent
  },
  {
    path: 'canvas-tester',
    component: CanvasTesterComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DevRoutingModule { }
