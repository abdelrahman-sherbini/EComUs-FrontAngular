import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ProfileComponent} from '../user/profile/profile.component';
import {TestComponent} from './test/test.component';
import {LayoutComponent} from './layout/layout.component';
import {OrdersComponent} from './orders/orders.component';
import {ProductManagementComponent} from './product-management/product-management.component';
import {CategoryManagementComponent} from './category-management/category-management.component';

const routes:Routes = [
  // {
  //   path : '',component:TestComponent,
  // },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      // Add more admin routes here as needed
      { path: 'orders', component: OrdersComponent },
      {path :'test',component:TestComponent},
      {path :'products',component:ProductManagementComponent},
      { path: 'categories', component: CategoryManagementComponent },
      // { path: 'users', component: UsersComponent },
      // { path: 'analytics', component: AnalyticsComponent },
    ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,RouterModule.forChild(routes),
  ]
})
export class AdminModule { }
