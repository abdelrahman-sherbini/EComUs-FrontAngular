import { Routes } from '@angular/router';
import {LoginRedirectGuard} from './guards/login-redirect-guard';
import {AuthGuard} from './guards/auth-guard';
import {LoginComponent} from './components/login/login.component';
import {AdminGuard} from './guards/admin-guard';
import {DashboardComponent} from './modules/admin/dashboard/dashboard.component';
import {OrdersComponent} from './modules/admin/orders/orders.component';
import {TestComponent} from './modules/admin/test/test.component';
import {ProductManagementComponent} from './modules/admin/product-management/product-management.component';
import {CategoryManagementComponent} from './modules/admin/category-management/category-management.component';
import {UsersComponent} from './modules/admin/users/users.component';
import {AnalyticsComponent} from './modules/admin/analytics/analytics.component';
import {UserLayoutComponent} from './modules/layout/user-layout.component';
import {RegisterComponent} from './components/register/register.component';
import {PasswordResetComponent} from './components/password-reset/password-reset.component';

export const routes: Routes = [


  {
    path : 'admin',
    loadChildren: () => import('./modules/admin/admin-module').then(m => m.AdminModule),
    canActivate: [AuthGuard,AdminGuard],
  }
  ,

  {
    path: '',
    component: UserLayoutComponent,
    children: [
      {
        path: 'user',
        loadChildren: () => import('./modules/user/user-module').then(m => m.UserModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'products',
        loadChildren: () => import('./modules/shop/shop-module').then(m => m.ShopModule),
      },
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [LoginRedirectGuard]
      },
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [LoginRedirectGuard]
      },
      {
        path: 'password-reset',

        component: PasswordResetComponent
      },
    ]
  },
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: '**', redirectTo: '/products' }
];
