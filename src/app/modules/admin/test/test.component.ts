import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {AdminProductsService} from '../../openapi';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {


  constructor(public router: Router,private adminProductsService: AdminProductsService) {
    this.adminProductsService.getProducts().subscribe({
      next: (data) => {
        console.log('Products:', data);
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

}
