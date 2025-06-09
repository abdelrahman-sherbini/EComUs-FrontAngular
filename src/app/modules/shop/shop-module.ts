// shop-module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsComponent } from './products/products.component';
// import { CartComponent } from './cart/cart.component';
import { RouterModule, Routes } from '@angular/router';
// import { AuthGuard } from '../../guards/auth-guard';

const routes: Routes = [
  {
    path: '',
    component: ProductsComponent
  },
  // {
  //   path: 'cart',
  //   component: CartComponent,
  //   canActivate: [AuthGuard] // Protect cart route with authentication
  // }
];

@NgModule({
  declarations: [
    // Remove declarations since components are standalone
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ShopModule { }