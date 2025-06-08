import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';

import {HomeComponent} from './home/home.component';
import {FormsModule} from '@angular/forms';
import {HeaderComponent} from './header/header.component';
import {ProductGridComponent} from './product-grid/product-grid.component';
import {ProductFilterComponent} from './product-filter/product-filter.component';
import {FooterComponent} from './footer/footer.component';

const routes: Routes = [
  {
    path : '',
    component:HomeComponent
  }

]

@NgModule({
  declarations: [
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    HomeComponent,
    HeaderComponent,
    ProductGridComponent,
    ProductFilterComponent,
    FooterComponent,
  ]
})
export class ShopModule { }
