import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-account',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-account.component.html',
  styleUrls: ['./update-account.component.css']
})
export class UpdateAccountComponent implements OnInit {
  updateForm: FormGroup;
  passwordForm: FormGroup;
  activeSection = 'personal-info';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Initialize personal info form
    this.updateForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]],
      job: [''],
      bd: ['']
    });

    // Initialize password form with custom validator
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    this.loadCurrentUserData();
  }

  // Custom validator for password strength
  passwordStrengthValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    if (!valid) {
      return {
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar
        }
      };
    }
    return null;
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadCurrentUserData() {
    this.loading = true;
    this.http.get<any>('http://localhost:8080/api/public/users/profile')
      .subscribe({
        next: (data) => {
          // Populate form with current user data
          this.updateForm.patchValue({
            userName: data.userName,
            email: data.email,
            phone: data.phone,
            job: data.job,
            bd: data.bd
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load user data:', error);
          this.showMessage('Failed to load user data', 'error');
          this.loading = false;
        }
      });
  }

  setActiveSection(section: string) {
    this.activeSection = section;
    this.message = ''; // Clear any previous messages
  }

  onUpdatePersonalInfo() {
    if (this.updateForm.valid) {
      this.loading = true;
      const formData = this.updateForm.value;

      this.http.put('http://localhost:8080/api/users/update-profile', formData)
        .subscribe({
          next: (response) => {
            this.showMessage('Personal information updated successfully!', 'success');
            this.loading = false;
          },
          error: (error) => {
            console.error('Update failed:', error);
            this.showMessage('Failed to update personal information. Please try again.', 'error');
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.updateForm);
    }
  }

  onChangePassword() {
    if (this.passwordForm.valid) {
      this.loading = true;
      const passwordData = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };

      this.http.put('http://localhost:8080/api/users/change-password', passwordData)
        .subscribe({
          next: (response) => {
            this.showMessage('Password changed successfully!', 'success');
            this.passwordForm.reset();
            this.loading = false;
          },
          error: (error) => {
            console.error('Password change failed:', error);
            this.showMessage('Failed to change password. Please check your current password.', 'error');
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    // Clear message after 5 seconds
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  // Helper methods for template
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid format';
      if (field.errors['passwordStrength']) {
        const errors = field.errors['passwordStrength'];
        const missing = [];
        if (!errors.hasUpperCase) missing.push('uppercase letter');
        if (!errors.hasLowerCase) missing.push('lowercase letter');
        if (!errors.hasNumeric) missing.push('number');
        if (!errors.hasSpecialChar) missing.push('special character');
        return `Password must contain: ${missing.join(', ')}`;
      }
    }
    return '';
  }

  getPasswordMatchError(): string {
    if (this.passwordForm.errors?.['passwordMismatch'] &&
      this.passwordForm.get('confirmPassword')?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  // Add these methods to your component class
  hasUppercase(value: string): boolean {
    return /[A-Z]/.test(value);
  }

  hasLowercase(value: string): boolean {
    return /[a-z]/.test(value);
  }

  hasNumber(value: string): boolean {
    return /[0-9]/.test(value);
  }

  hasSpecialChar(value: string): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(value);
  }

  hasMinLength(value: string): boolean {
    return Boolean(value && value.length >= 8);
  }
}



// // update-account.component.ts
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
// import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
//
// // Import the generated services and DTOs
// import { CustomerProfileService } from '../../../openapi/api/customer-profile.service';
// import { UserDTO } from '../../../openapi/model/user-dto';
// import { UpdateProfileDTO } from '../../../openapi/model/update-profile-dto';
// import { ChangePasswordDTO } from '../../../openapi/model/change-password-dto';
// import { AddressDTO } from '../../../openapi/model/address-dto';
//
// // Custom validator functions for better form validation
// export class CustomValidators {
//   static creditCardNumber(control: AbstractControl): {[key: string]: any} | null {
//     const value = control.value;
//     if (!value) return null;
//
//     // Remove spaces and hyphens
//     const cleanValue = value.replace(/[\s-]/g, '');
//
//     // Check if it's 16 digits
//     if (!/^\d{16}$/.test(cleanValue)) {
//       return { 'invalidCreditCard': true };
//     }
//
//     // Simple Luhn algorithm check
//     let sum = 0;
//     let shouldDouble = false;
//
//     for (let i = cleanValue.length - 1; i >= 0; i--) {
//       let digit = parseInt(cleanValue.charAt(i));
//
//       if (shouldDouble) {
//         digit *= 2;
//         if (digit > 9) digit -= 9;
//       }
//
//       sum += digit;
//       shouldDouble = !shouldDouble;
//     }
//
//     return (sum % 10 === 0) ? null : { 'invalidCreditCard': true };
//   }
//
//   static phoneNumber(control: AbstractControl): {[key: string]: any} | null {
//     const value = control.value;
//     if (!value) return null;
//
//     // Allow international formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
//     const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
//     return phoneRegex.test(value) ? null : { 'invalidPhone': true };
//   }
// }
//
// @Component({
//   selector: 'app-update-account',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './update-account.component.html',
//   styleUrls: ['./update-account.component.css']
// })
// export class UpdateAccountComponent implements OnInit, OnDestroy {
//   updateForm: FormGroup;
//   loading = false;
//   error: string | null = null;
//   success: string | null = null;
//   user: UserDTO | null = null;
//   showPasswordFields = false;
//
//   // Track form state for better UX
//   hasUnsavedChanges = false;
//   isFormSubmitting = false;
//
//   // Manage component lifecycle properly
//   private destroy$ = new Subject<void>();
//
//   constructor(
//     private fb: FormBuilder,
//     private customerProfileService: CustomerProfileService
//   ) {
//     this.updateForm = this.createForm();
//     this.setupFormChangeTracking();
//   }
//
//   ngOnInit() {
//     this.loadUserProfile();
//   }
//
//   ngOnDestroy() {
//     // Clean up subscriptions to prevent memory leaks
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
//
//   /**
//    * Creates the reactive form with proper validation rules
//    * This approach provides better type safety and validation control
//    */
//   private createForm(): FormGroup {
//     return this.fb.group({
//       personalInfo: this.fb.group({
//         userName: ['', [
//           Validators.required,
//           Validators.minLength(3),
//           Validators.maxLength(50),
//           Validators.pattern(/^[a-zA-Z0-9_]+$/) // Allow only alphanumeric and underscore
//         ]],
//         email: ['', [
//           Validators.required,
//           Validators.email,
//           Validators.maxLength(100)
//         ]],
//         phone: ['', [CustomValidators.phoneNumber]],
//         job: ['', [Validators.maxLength(100)]],
//         bd: ['', [this.dateValidator]]
//       }),
//       passwordInfo: this.fb.group({
//         currentPassword: [''],
//         newPassword: ['', [
//           Validators.minLength(8),
//           this.strongPasswordValidator
//         ]],
//         confirmPassword: ['']
//       }, { validators: this.passwordMatchValidator }),
//       paymentInfo: this.fb.group({
//         creditNo: ['', [CustomValidators.creditCardNumber]],
//         creditLimit: [null, [Validators.min(0), Validators.max(1000000)]]
//       }),
//       addresses: this.fb.array([])
//     });
//   }
//
//   /**
//    * Custom validator for strong passwords
//    * Requires at least one uppercase, lowercase, number, and special character
//    */
//   private strongPasswordValidator(control: AbstractControl): {[key: string]: any} | null {
//     const value = control.value;
//     if (!value) return null;
//
//     const hasUpperCase = /[A-Z]/.test(value);
//     const hasLowerCase = /[a-z]/.test(value);
//     const hasNumeric = /[0-9]/.test(value);
//     const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
//
//     const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
//     return valid ? null : { 'weakPassword': true };
//   }
//
//   /**
//    * Custom validator for birth date
//    * Ensures user is at least 13 years old and not born in the future
//    */
//   private dateValidator(control: AbstractControl): {[key: string]: any} | null {
//     const value = control.value;
//     if (!value) return null;
//
//     const birthDate = new Date(value);
//     const today = new Date();
//     const age = today.getFullYear() - birthDate.getFullYear();
//
//     if (birthDate > today) {
//       return { 'futureDate': true };
//     }
//
//     if (age < 13) {
//       return { 'tooYoung': true };
//     }
//
//     return null;
//   }
//
//   /**
//    * Validates that password confirmation matches new password
//    */
//   private passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
//     const newPassword = group.get('newPassword')?.value;
//     const confirmPassword = group.get('confirmPassword')?.value;
//
//     if (newPassword && confirmPassword && newPassword !== confirmPassword) {
//       return { passwordMismatch: true };
//     }
//     return null;
//   }
//
//   /**
//    * Sets up form change tracking to detect unsaved changes
//    * This helps prevent users from accidentally losing their work
//    */
//   private setupFormChangeTracking(): void {
//     this.updateForm.valueChanges
//       .pipe(
//         takeUntil(this.destroy$),
//         debounceTime(300), // Wait 300ms after user stops typing
//         distinctUntilChanged()
//       )
//       .subscribe(() => {
//         this.hasUnsavedChanges = true;
//       });
//   }
//
//   get addressesArray(): FormArray {
//     return this.updateForm.get('addresses') as FormArray;
//   }
//
//   /**
//    * Creates a form group for address with proper validation
//    */
//   private createAddressGroup(address?: AddressDTO): FormGroup {
//     return this.fb.group({
//       id: [address?.id || null],
//       street: [address?.street || '', [Validators.required, Validators.maxLength(200)]],
//       city: [address?.city || '', [Validators.required, Validators.maxLength(100)]],
//       area: [address?.area || '', [Validators.required, Validators.maxLength(100)]],
//       buildingNo: [address?.buildingNo || '', [Validators.required, Validators.maxLength(50)]]
//     });
//   }
//
//   /**
//    * Loads user profile using the generated service
//    * This approach is more type-safe and follows Angular best practices
//    */
//   loadUserProfile(): void {
//     this.loading = true;
//     this.error = null;
//
//     this.customerProfileService.profile()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (userData: UserDTO) => {
//           this.user = userData;
//           this.populateForm(userData);
//           this.loading = false;
//           this.hasUnsavedChanges = false;
//         },
//         error: (error: any) => {
//           console.error('Failed to load user profile:', error);
//           this.error = 'Failed to load user profile. Please try again.';
//           this.loading = false;
//         }
//       });
//   }
//
//   /**
//    * Populates the form with user data
//    * Handles the case where some fields might be undefined
//    */
//   private populateForm(userData: UserDTO): void {
//     // Populate personal info
//     this.updateForm.patchValue({
//       personalInfo: {
//         userName: userData.userName || '',
//         email: userData.email || '',
//         phone: userData.phone || '',
//         job: userData.job || '',
//         bd: userData.bd || ''
//       },
//       paymentInfo: {
//         creditNo: userData.creditNo || '',
//         creditLimit: userData.creditLimit || null
//       }
//     });
//
//     // Populate addresses
//     this.populateAddresses(userData.addresses || []);
//   }
//
//   /**
//    * Populates the addresses form array
//    */
//   private populateAddresses(addresses: AddressDTO[]): void {
//     const addressesArray = this.updateForm.get('addresses') as FormArray;
//     addressesArray.clear();
//
//     if (addresses && addresses.length > 0) {
//       addresses.forEach(address => {
//         addressesArray.push(this.createAddressGroup(address));
//       });
//     } else {
//       // Add one empty address if none exist
//       this.addAddress();
//     }
//   }
//
//   /**
//    * Adds a new address form group to the form array
//    */
//   addAddress(): void {
//     const addressesArray = this.updateForm.get('addresses') as FormArray;
//     addressesArray.push(this.createAddressGroup());
//   }
//
//   /**
//    * Removes an address at the specified index
//    */
//   removeAddress(index: number): void {
//     const addressesArray = this.updateForm.get('addresses') as FormArray;
//     if (addressesArray.length > 1) {
//       addressesArray.removeAt(index);
//     }
//   }
//
//   /**
//    * Toggles the password fields visibility
//    */
//   togglePasswordFields(): void {
//     this.showPasswordFields = !this.showPasswordFields;
//
//     if (!this.showPasswordFields) {
//       // Clear password fields when hiding
//       this.updateForm.get('passwordInfo')?.reset();
//     } else {
//       // Add required validators when showing password fields
//       const passwordGroup = this.updateForm.get('passwordInfo');
//       passwordGroup?.get('currentPassword')?.setValidators([Validators.required]);
//       passwordGroup?.get('newPassword')?.setValidators([
//         Validators.required,
//         Validators.minLength(8),
//         this.strongPasswordValidator
//       ]);
//       passwordGroup?.get('confirmPassword')?.setValidators([Validators.required]);
//       passwordGroup?.updateValueAndValidity();
//     }
//   }
//
//   /**
//    * Handles form submission with proper error handling
//    */
//   onSubmit(): void {
//     if (this.updateForm.valid) {
//       this.updateAccount();
//     } else {
//       this.markFormGroupTouched(this.updateForm);
//       this.error = 'Please fix the validation errors before submitting.';
//     }
//   }
//
//   /**
//    * Recursively marks all form controls as touched to show validation errors
//    */
//   private markFormGroupTouched(formGroup: FormGroup): void {
//     Object.keys(formGroup.controls).forEach(key => {
//       const control = formGroup.get(key);
//       if (control instanceof FormGroup) {
//         this.markFormGroupTouched(control);
//       } else if (control instanceof FormArray) {
//         control.controls.forEach(arrayControl => {
//           if (arrayControl instanceof FormGroup) {
//             this.markFormGroupTouched(arrayControl);
//           } else {
//             arrayControl.markAsTouched();
//           }
//         });
//       } else {
//         control?.markAsTouched();
//       }
//     });
//   }
//
//   /**
//    * Updates the user account using the generated services
//    */
//   async updateAccount(): Promise<void> {
//     this.isFormSubmitting = true;
//     this.loading = true;
//     this.error = null;
//     this.success = null;
//
//     const formData = this.updateForm.value;
//
//     try {
//       // Update profile information
//       await this.updateProfile(formData);
//
//       // Update password if needed
//       if (this.showPasswordFields && formData.passwordInfo.newPassword) {
//         await this.changePassword(formData.passwordInfo);
//       }
//
//       this.success = 'Account updated successfully!';
//       this.showPasswordFields = false;
//       this.updateForm.get('passwordInfo')?.reset();
//       this.hasUnsavedChanges = false;
//
//       // Auto-hide success message after 5 seconds
//       setTimeout(() => {
//         this.success = null;
//       }, 5000);
//
//     } catch (error: any) {
//       console.error('Failed to update account:', error);
//       this.error = this.getErrorMessage(error);
//
//       // Auto-hide error message after 8 seconds
//       setTimeout(() => {
//         this.error = null;
//       }, 8000);
//     } finally {
//       this.isFormSubmitting = false;
//       this.loading = false;
//     }
//   }
//
//   /**
//    * Updates user profile using the generated service
//    */
//   private updateProfile(formData: any): Promise<UserDTO> {
//     const updatePayload: UpdateProfileDTO = {
//       userName: formData.personalInfo.userName,
//       email: formData.personalInfo.email,
//       phone: formData.personalInfo.phone || undefined,
//       job: formData.personalInfo.job || undefined,
//       creditNo: formData.paymentInfo.creditNo || undefined,
//       creditLimit: formData.paymentInfo.creditLimit || undefined
//     };
//
//     return this.customerProfileService.updateProfile(updatePayload)
//       .pipe(takeUntil(this.destroy$))
//       .toPromise() as Promise<UserDTO>;
//   }
//
//   /**
//    * Changes user password using the generated service
//    */
//   private changePassword(passwordInfo: any): Promise<string> {
//     const changePasswordPayload: ChangePasswordDTO = {
//       oldPassword: passwordInfo.currentPassword,
//       newPassword: passwordInfo.newPassword
//     };
//
//     return this.customerProfileService.updatePassword(changePasswordPayload)
//       .pipe(takeUntil(this.destroy$))
//       .toPromise() as Promise<string>;
//   }
//
//   /**
//    * Extracts user-friendly error messages from API responses
//    */
//   private getErrorMessage(error: any): string {
//     if (error?.error?.message) {
//       return error.error.message;
//     }
//     if (error?.message) {
//       return error.message;
//     }
//     return 'An unexpected error occurred. Please try again.';
//   }
//
//   /**
//    * Dismisses messages manually
//    */
//   dismissMessage(type: 'success' | 'error'): void {
//     if (type === 'success') {
//       this.success = null;
//     } else {
//       this.error = null;
//     }
//   }
//
//   /**
//    * Helper method to check if a form field is invalid and should show errors
//    */
//   isFieldInvalid(fieldPath: string): boolean {
//     const field = this.updateForm.get(fieldPath);
//     return !!(field && field.invalid && (field.dirty || field.touched));
//   }
//
//   /**
//    * Gets the appropriate error message for a form field
//    */
//   getFieldError(fieldPath: string): string {
//     const field = this.updateForm.get(fieldPath);
//     if (field && field.errors) {
//       const errors = field.errors;
//
//       if (errors['required']) return 'This field is required';
//       if (errors['email']) return 'Please enter a valid email address';
//       if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
//       if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
//       if (errors['pattern']) return 'Please enter a valid format';
//       if (errors['min']) return `Value must be at least ${errors['min'].min}`;
//       if (errors['max']) return `Value must be at most ${errors['max'].max}`;
//       if (errors['invalidCreditCard']) return 'Please enter a valid 16-digit credit card number';
//       if (errors['invalidPhone']) return 'Please enter a valid phone number';
//       if (errors['weakPassword']) return 'Password must contain uppercase, lowercase, number, and special character';
//       if (errors['futureDate']) return 'Birth date cannot be in the future';
//       if (errors['tooYoung']) return 'You must be at least 13 years old';
//     }
//     return '';
//   }
//
//   /**
//    * Gets password-specific error messages
//    */
//   getPasswordError(): string {
//     const passwordGroup = this.updateForm.get('passwordInfo');
//     if (passwordGroup && passwordGroup.errors) {
//       if (passwordGroup.errors['passwordMismatch']) {
//         return 'Passwords do not match';
//       }
//     }
//     return '';
//   }
//
//   /**
//    * Checks if the form can be submitted
//    */
//   canSubmit(): boolean {
//     return this.updateForm.valid && !this.isFormSubmitting;
//   }
// }
//
//
//
