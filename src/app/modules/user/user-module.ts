import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ProfileComponent} from './profile/profile.component';

const routes:Routes = [
  {
      path : '',component:DashboardComponent,
  },
  {
      path :'profile',component:ProfileComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,RouterModule.forChild(routes)
  ]
})
export class UserModule { }
