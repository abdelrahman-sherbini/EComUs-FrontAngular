import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminProductsService } from '../../openapi';
import { ToastService } from '../../../services/toast';
import { ToastComponent } from '../../../components/toast/toast.component';
import { PopupService, PopupOption } from '../../../services/popup.service';
import { CommonModule } from '@angular/common';
import {PopupComponent} from '../../../components/popup/popup.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    PopupComponent
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {

  constructor(
    private toastService: ToastService,
    public router: Router,
    private adminProductsService: AdminProductsService,
    private popupService: PopupService
  ) {
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

  // Toast test methods
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

  // Popup test methods
  testAlertPopup() {
    this.popupService.showAlert('This is a simple alert message', 'Alert Test');
  }

  testConfirmPopup() {
    const options: PopupOption[] = [
      { text: 'Cancel', value: false, style: 'secondary' },
      { text: 'Confirm', value: true, style: 'primary', action: () => console.log('User confirmed!') }
    ];

    this.popupService.showConfirm('Are you sure you want to proceed?', options, 'Confirmation Test');
  }

  testLoginPopup() {
    this.popupService.showLoginPrompt('You need to be logged in to access this feature');
  }

  testPromptPopup() {
    this.popupService.showPrompt(
      'Please enter your email address:',
      'email@example.com',
      '',
      'email',
      [
        { text: 'Cancel', value: null, style: 'secondary' },
        {
          text: 'Submit',
          value: true,
          style: 'primary',
          action: () => console.log('User submitted email!')
        }
      ],
      'Email Subscription'
    );
  }

  testMultiOptionPopup() {
    const options: PopupOption[] = [
      { text: 'Option 1', value: 1, style: 'primary', action: () => console.log('Selected Option 1') },
      { text: 'Option 2', value: 2, style: 'info', action: () => console.log('Selected Option 2') },
      { text: 'Option 3', value: 3, style: 'success', action: () => console.log('Selected Option 3') },
      { text: 'Cancel', value: 0, style: 'secondary', action: () => console.log('Cancelled') }
    ];

    this.popupService.showConfirm('Please select an option:', options, 'Multiple Options');
  }
}
