import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ProfileComponent} from './profile/profile.component';
import {WishlistComponent } from './wishlist/wishlist.component';
import { FormsModule } from '@angular/forms';

const routes:Routes = [
  {
      path : '',component:DashboardComponent,
  },
  {
      path :'profile',component:ProfileComponent,
  },
  {
    path: 'wishlist',
    component: WishlistComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class UserModule { }
