import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductsComponent} from './products/products.component';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path : '',
    component:ProductsComponent
  }

]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,RouterModule.forChild(routes)
  ]
})
export class ShopModule { }
