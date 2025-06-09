import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {FormsModule} from '@angular/forms';
import {ProductGridComponent} from './product-grid/product-grid.component';
import {ProductFilterComponent} from './product-filter/product-filter.component';
import {ProductDetailsComponent} from './product-details/product-details.component';

const routes: Routes = [
  {
    path: 'product/:id',
    component: ProductDetailsComponent
  },
  {
    path: '',
    component: HomeComponent
  }

];


@NgModule({
  declarations: [
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    ProductGridComponent,
    ProductFilterComponent,
    ProductDetailsComponent
  ]
})
export class ShopModule { }
