import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ProfileComponent} from './profile/profile.component';
import {WishlistComponent } from './wishlist/wishlist.component';
import { FormsModule } from '@angular/forms';
import { AccountComponent } from './account-details/account.component';
import {CheckoutComponent} from './checkout/checkout.component';
import {CartComponent} from './cart/cart.component';

const routes:Routes = [
  {
      path : '',component:DashboardComponent,
  },
  {
      path :'profile',component:ProfileComponent,
  },
  // {
  //   path: 'wishlist',
  //   component: WishlistComponent,
  // },
  {
    path: 'cart',
    component: CartComponent,
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
  },
  {
    path: 'account',
    component: AccountComponent,
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
