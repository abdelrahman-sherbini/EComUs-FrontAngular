// user.module.ts - Updated with Cart Component
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'cart',
    component: CartComponent,
  },
   {
    path: 'checkout',
    component: CheckoutComponent,
  },
];

@NgModule({
  declarations: [
    // Add your cart component here if it's not already declared
    
  ],
  imports: [
    CommonModule,
    CartComponent,
    CheckoutComponent,
    RouterModule.forChild(routes)
  ]
})
export class UserModule { }