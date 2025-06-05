import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from '../user/dashboard/dashboard.component';
import {ProfileComponent} from '../user/profile/profile.component';
import {TestComponent} from './test/test.component';

const routes:Routes = [
  {
    path : '',component:TestComponent,
  },

];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,RouterModule.forChild(routes),
  ]
})
export class AdminModule { }
