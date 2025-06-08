import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {AdminProductsService} from '../../openapi';
import {ToastService} from '../../../services/toast';
import {ToastComponent} from '../../../components/toast/toast.component';

@Component({
  selector: 'app-test',
  imports: [
    ToastComponent
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {

  constructor(private toastService: ToastService, public router: Router, private adminProductsService: AdminProductsService) {
    // Add debugging to see if service is working
    console.log('TestComponent initialized');

    this.adminProductsService.getProducts().subscribe({
      next: (data) => {
        console.log('Products:', data);
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  testSuccess() {
    console.log('testSuccess called');
    console.log('Toasts before:', this.toastService.getToastsCount());
    this.toastService.showSuccess('Success message');
    console.log('Toasts after:', this.toastService.getToastsCount());

    // Also test the observable directly
    this.toastService.toasts$.subscribe(toasts => {
      console.log('Current toasts in observable:', toasts);
    });
  }

  testError() {
    console.log('testError called');
    this.toastService.showError('Error message');
  }

  testWarning() {
    console.log('testWarning called');
    this.toastService.showWarning('Warning message');
  }

  testInfo() {
    console.log('testInfo called');
    this.toastService.showInfo('Info message');
  }
}
