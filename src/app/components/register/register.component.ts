import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserSignUpDTO } from '../../modules/openapi';
import { AuthService } from '../../services/auth-service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// Custom validator functions for better form validation
export class CustomValidators {
  static creditCardNumber(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    // Remove spaces and hyphens for validation
    const cleanValue = value.replace(/[\s-]/g, '');

    // Check if it's 16 digits
    if (!/^\d{16}$/.test(cleanValue)) {
      return { 'invalidCreditCard': true };
    }

    // Skip Luhn algorithm check for now to make validation easier
    return null;
  }

  static phoneNumber(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    // Allow international formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value) ? null : { 'invalidPhone': true };
  }

  static birthDate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const birthDate = new Date(value);
    const today = new Date();

    // Check if birth date is in the future
    if (birthDate > today) {
      return { 'futureDate': true };
    }

    // Check if user is at least 8 years old
    const minAge = 8;
    const minAgeDate = new Date();
    minAgeDate.setFullYear(today.getFullYear() - minAge);

    if (birthDate > minAgeDate) {
      return { 'tooYoung': true };
    }

    return null;
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, FormsModule, RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/user/dashboard';

    // Subscribe to auth state for loading and error handling
    this.authService.authState$.subscribe(state => {
      this.isLoading = state.isLoading;
      this.errorMessage = state.error || '';

      if (state.isAuthenticated) {
        this.router.navigate([this.returnUrl]);
      }
    });
  }

  private createRegisterForm(): FormGroup {
    return this.fb.group({
      userName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.strongPasswordValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      phone: ['', [
        CustomValidators.phoneNumber
      ]],
      job: ['', [
        Validators.maxLength(100)
      ]],
      creditNo: ['', [
        CustomValidators.creditCardNumber
      ]],
      creditLimit: [null, [
        Validators.min(0),
        Validators.max(1000000)
      ]],
      bd: ['', [
        CustomValidators.birthDate
      ]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator for strong passwords
   */
  private strongPasswordValidator(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
    return valid ? null : { 'weakPassword': true };
  }

  /**
   * Validates password confirmation
   */
  private passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
    const newPassword = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const userData: UserSignUpDTO = {
        userName: this.registerForm.value.userName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        phone: this.registerForm.value.phone || undefined,
        job: this.registerForm.value.job || undefined,
        creditNo: this.registerForm.value.creditNo || undefined,
        creditLimit: this.registerForm.value.creditLimit || undefined,
        bd: this.registerForm.value.bd || undefined
      };

      this.authService.register(userData).subscribe({
        next: () => {
          // Navigation is handled by the auth state subscription
        },
        error: (error) => {
          console.error('Registration error:', error);
          // Error message is handled by the auth state subscription
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.registerForm);
    }
  }

  /**
   * Marks all controls in a form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Checks if a form field is invalid and should show errors
   */
  isFieldInvalid(fieldPath: string): boolean {
    const field = this.registerForm.get(fieldPath);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Gets error message for a field
   */
  getFieldError(fieldPath: string): string {
    const field = this.registerForm.get(fieldPath);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern'] && fieldPath === 'userName') return 'Username can only contain letters, numbers, and underscores';
    if (errors['pattern']) return 'Invalid format';
    if (errors['invalidPhone']) return 'Please enter a valid phone number';
    if (errors['invalidCreditCard']) return 'Please enter a valid 16-digit credit card number';
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['futureDate']) return 'Birth date cannot be in the future';
    if (errors['tooYoung']) return 'You must be at least 8 years old';
    if (errors['weakPassword']) return 'Password must contain uppercase, lowercase, number, and special character';
    if (errors['passwordMismatch']) return 'Passwords do not match';

    return 'Invalid value';
  }

  // Password strength helper methods
  hasUppercase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  hasLowercase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  hasNumber(password: string): boolean {
    return /[0-9]/.test(password);
  }

  hasSpecialChar(password: string): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  hasMinLength(password: string): boolean {
    return Boolean(password && password.length >= 8);
  }
}
