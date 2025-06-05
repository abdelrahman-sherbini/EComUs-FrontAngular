import { Routes } from '@angular/router';
import {LoginRedirectGuard} from './guards/login-redirect-guard';
import {AuthGuard} from './guards/auth-guard';
import {LoginComponent} from './components/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginRedirectGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./modules/user/user-module').then(m => m.UserModule),
    canActivate: [AuthGuard]
  },
  {
    path : 'admin',
    loadChildren: () => import('./modules/admin/admin-module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  }
  ,
  {
    path: 'products',
    loadChildren: () => import('./modules/shop/shop-module').then(m => m.ShopModule),
  },
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: '**', redirectTo: '/products' }
];
