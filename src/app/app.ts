import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AdminProductsService,
  AuthenticationService,
  CustomerCategoriesService,
  CustomerProductsService
} from './modules/openapi';
import {AsyncPipe, CommonModule} from '@angular/common';
import {Observable} from 'rxjs';
import {AuthService} from './services/auth-service';
import {BrowserModule} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'front';
  isLoading$: Observable<boolean>;


  constructor(private authService: AuthService,private prod:AdminProductsService,private auth:AuthenticationService,private productService:CustomerProductsService,private categoriesService:CustomerCategoriesService) {

    this.isLoading$ = this.authService.isLoading$;
  }


  ngOnInit() {
    // this.auth.login({
    //   email: 'user2@example.com',
    //   password: 'pass'
    // }).subscribe({
    //   next: (response) => {
    //     console.log('Login successful:', response);
    //   },
    //   error: (err) => {
    //     console.error('Login failed:', err);
    //   }
    // });
    // this.prod.deleteProduct(599).subscribe({
    //   next: (response) => {
    //     console.log('Product deleted successfully:', response);
    //   },
    //   error: (err) => {
    //     console.error('Error deleting product:', err);
    //   }
    // });
    //
    // this.productService.getProducts1().subscribe({
    //   next: (products) => {
    //     console.log('Products loaded:', products);
    //   },
    //   error: (err) => {
    //     console.error('Error loading products:', err);
    //   }
    // });
    // this.categoriesService.getCategories1().subscribe({
    //   next: (categories) => {
    //     console.log('Categories loaded:', categories);
    //   },
    //   error: (err) => {
    //     console.error('Error loading categories:', err);
    //   }
    // })
    // this.productService.getProductById1(1).subscribe({
    //   next: (product) => {
    //     console.log('Product loaded:', product);
    //   },
    //   error: (err) => {
    //     console.error('Error loading product:', err);
    //   }
    // })

  }
}
