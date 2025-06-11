import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerProfileService } from '../../modules/openapi/api/customer-profile.service';
import { PasswordResetRequestDTO } from '../../modules/openapi/model/password-reset-request-dto';
import { PasswordResetDTO } from '../../modules/openapi/model/password-reset-dto';
import {AuthenticationService} from '../../modules/openapi';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, FormsModule, RouterModule
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent implements OnInit {
  resetRequestForm: FormGroup;
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resetToken: string | null = null;
  showResetForm = false;
  tokenValid = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private customerProfileService: AuthenticationService
  ) {
    this.resetRequestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.strongPasswordValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if there's a token in the URL
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'];
      if (this.resetToken) {
        this.validateToken(this.resetToken);
      }
    });
  }

  /**
   * Validates the reset token
   */
  validateToken(token: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.customerProfileService.validateResetToken(token).subscribe({
      next: (isValid) => {
        console.log('Token validation response:', isValid);

        this.tokenValid = Boolean(isValid);
        this.showResetForm = Boolean(isValid);

        if (!this.tokenValid) {
          this.errorMessage = 'Invalid or expired password reset token. Please request a new one.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Token validation error:', error);
        this.errorMessage = 'Failed to validate reset token. Please try again.';
        this.showResetForm = false;
        this.tokenValid = false;
        this.isLoading = false;
      }
    });
  }

  /**
   * Submits the password reset request form
   */
  onRequestReset(): void {
    if (this.resetRequestForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const resetRequest: PasswordResetRequestDTO = {
        email: this.resetRequestForm.value.email
      };

      this.customerProfileService.forgotPassword(resetRequest).subscribe({
        next: () => {
          this.successMessage = 'Password reset instructions have been sent to your email.';
          this.resetRequestForm.reset();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Password reset request error:', error);
          this.errorMessage = 'Failed to process your request. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Submits the new password form
   */
  onResetPassword(): void {
    if (this.resetPasswordForm.valid && this.resetToken) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const resetData: PasswordResetDTO = {
        token: this.resetToken,
        newPassword: this.resetPasswordForm.value.newPassword
      };

      this.customerProfileService.resetPassword(resetData).subscribe({
        next: () => {
          this.successMessage = 'Your password has been successfully reset.';
          this.resetPasswordForm.reset();
          this.isLoading = false;

          // Redirect to login page after a short delay
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          console.error('Password reset error:', error);
          this.errorMessage = 'Failed to reset your password. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Custom validator for strong passwords
   */
  private strongPasswordValidator(control: any): {[key: string]: any} | null {
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
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Navigate back to login page
   */
  backToLogin(): void {
    this.router.navigate(['/login']);
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
