import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';

// Import the generated services and DTOs
import { CustomerProfileService } from '../../../openapi/api/customer-profile.service';
import { CustomerAddressesService } from '../../../openapi/api/customer-addresses.service';
import { UserDTO } from '../../../openapi/model/user-dto';
import { UpdateProfileDTO } from '../../../openapi/model/update-profile-dto';
import { ChangePasswordDTO } from '../../../openapi/model/change-password-dto';
import { AddressDTO } from '../../../openapi/model/address-dto';
import { ToastService } from '../../../../services/toast';

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
}

@Component({
  selector: 'app-update-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-account.component.html',
  styleUrls: ['./update-account.component.css']
})
export class UpdateAccountComponent implements OnInit, OnDestroy {
  // Form groups
  updateForm: FormGroup;
  passwordForm: FormGroup;
  addressForm: FormGroup;

  // Loading states
  loading = false;
  passwordLoading = false;
  addressLoading = false;

  // Messages
  message: string | null = null;
  messageType: 'success' | 'error' = 'success';

  // User data
  user: UserDTO | null = null;

  // Track form state for better UX
  hasUnsavedChanges = false;

  // Manage component lifecycle properly
  private destroy$ = new Subject<void>();

  constructor(
    private customerAddressesService: CustomerAddressesService,
    private fb: FormBuilder,
    private customerProfileService: CustomerProfileService,
    private toastService: ToastService
  ) {
    this.updateForm = this.createUpdateForm();
    this.passwordForm = this.createPasswordForm();
    this.addressForm = this.createAddressForm();
    this.setupFormChangeTracking();
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Creates the personal information update form
   * Note: Birth date (bd) is included in the form but is not editable
   */
  private createUpdateForm(): FormGroup {
    const form = this.fb.group({
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
      phone: ['', [CustomValidators.phoneNumber]],
      job: ['', [Validators.maxLength(100)]],
      creditNo: ['', [CustomValidators.creditCardNumber]],
      creditLimit: [null, [Validators.min(0), Validators.max(1000000)]],
      // Birth date is displayed but not editable
      bd: [{value: '', disabled: true}]
    });

    return form;
  }

  /**
   * Creates the password change form
   */
  private createPasswordForm(): FormGroup {
    return this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.strongPasswordValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Creates the address management form
   */
  private createAddressForm(): FormGroup {
    return this.fb.group({
      addresses: this.fb.array([])
    });
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
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Sets up form change tracking
   */
  private setupFormChangeTracking(): void {
    this.updateForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.hasUnsavedChanges = true;
      });
  }

  /**
   * Gets the addresses form array
   */
  get addressesArray(): FormArray {
    return this.addressForm.get('addresses') as FormArray;
  }

  /**
   * Creates an address form group
   */
  private createAddressGroup(address?: AddressDTO): FormGroup {
    return this.fb.group({
      id: [address?.id || null],
      city: [address?.city || '', [Validators.required, Validators.maxLength(100)]],
      area: [address?.area || '', [Validators.required, Validators.maxLength(100)]],
      street: [address?.street || '', [Validators.required, Validators.maxLength(200)]],
      buildingNo: [address?.buildingNo || '', [Validators.required, Validators.maxLength(50)]]
    });
  }

  /**
   * Loads user profile data
   */
  loadUserProfile(): void {
    this.loading = true;
    this.message = null;

    this.customerProfileService.profile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userData: UserDTO) => {
          this.user = userData;
          this.populateForm(userData);
          this.loading = false;
          this.hasUnsavedChanges = false;
        },
        error: (error: any) => {
          console.error('Failed to load user profile:', error);
          this.showMessage('Failed to load user profile. Please try again.', 'error');
          this.loading = false;
        }
      });
  }

  /**
   * Populates forms with user data
   */
  private populateForm(userData: UserDTO): void {
    // Populate personal info form
    this.updateForm.patchValue({
      userName: userData.userName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      job: userData.job || '',
      bd: userData.bd || '', // Birth date - not part of UpdateProfileDTO
      creditNo: userData.creditNo || '',
      creditLimit: userData.creditLimit || null
    });

    // Disable the birth date field since it's not editable
    this.updateForm.get('bd')?.disable();

    // Populate addresses
    this.populateAddresses(userData.addresses || []);
  }

  /**
   * Populates addresses form array
   */
  private populateAddresses(addresses: AddressDTO[]): void {
    const addressesArray = this.addressForm.get('addresses') as FormArray;
    addressesArray.clear();

    if (addresses && addresses.length > 0) {
      addresses.forEach(address => {
        addressesArray.push(this.createAddressGroup(address));
      });
    } else {
      this.addAddress();
    }
  }

  /**
   * Adds a new address form group
   */
  addAddress(): void {
    const addressesArray = this.addressForm.get('addresses') as FormArray;
    addressesArray.push(this.createAddressGroup());
  }

  /**
   * Removes an address at the specified index
   */
  removeAddress(index: number): void {
    const addressesArray = this.addressForm.get('addresses') as FormArray;

    if (addressesArray.length > 1) {
      const address = addressesArray.at(index).value;

      // If it's an existing address with an ID, we should delete it from the server
      if (address.id) {
        this.customerAddressesService.deleteAddress(address.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              addressesArray.removeAt(index);
              this.showMessage('Address removed successfully', 'success');
              this.toastService.showSuccess('Address removed successfully');
            },
            error: (error) => {
              console.error('Failed to delete address:', error);
              this.showMessage('Failed to remove address. Please try again.', 'error');
            }
          });
      } else {
        // If it's a new address without an ID, just remove it from the form
        addressesArray.removeAt(index);
      }
    } else {
      this.showMessage('You must have at least one address', 'error');
    }
  }

  /**
   * Handles profile update using UpdateProfileDTO
   */
  onUpdateProfile(): void {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.updateForm);

    // Check only enabled controls for validation
    const enabledInvalid = Object.keys(this.updateForm.controls)
      .some(key => {
        const control = this.updateForm.get(key);
        return control && !control.disabled && control.invalid;
      });

    if (enabledInvalid) {
      this.showMessage('Please fix the validation errors before submitting.', 'error');
      return;
    }

    if (!this.hasProfileChanges()) {
      this.showMessage('No changes detected. Please make changes before submitting.', 'error');
      return;
    }

    this.loading = true;
    this.message = null;

    const formData = this.updateForm.getRawValue(); // Gets values from both enabled and disabled controls
    const updatePayload: UpdateProfileDTO = {
      userName: formData.userName,
      email: formData.email
    };

    // Add optional fields only if they have values
    if (formData.phone) {
      updatePayload.phone = formData.phone;
    }

    if (formData.job) {
      updatePayload.job = formData.job;
    }

    if (formData.creditNo) {
      updatePayload.creditNo = formData.creditNo;
    }

    if (formData.creditLimit !== null && formData.creditLimit !== undefined) {
      updatePayload.creditLimit = formData.creditLimit;
    }

    this.customerProfileService.updateProfile(updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showMessage('Profile updated successfully!', 'success');
          this.toastService.showSuccess('Profile updated successfully!');
          this.hasUnsavedChanges = false;

          // Reload user profile to get updated data
          this.loadUserProfile();
        },
        error: (error) => {
          console.error('Failed to update profile:', error);
          this.showMessage(this.getErrorMessage(error), 'error');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Handles password change
   */
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      this.showMessage('Please fix the validation errors before submitting.', 'error');
      return;
    }

    this.passwordLoading = true;
    this.message = null;

    const formData = this.passwordForm.value;
    const changePasswordPayload: ChangePasswordDTO = {
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword
    };

    this.customerProfileService.updatePassword(changePasswordPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showMessage('Password changed successfully!', 'success');
          this.toastService.showSuccess('Password changed successfully!');
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('Failed to change password:', error);
          this.showMessage(this.getErrorMessage(error), 'error');
        },
        complete: () => {
          this.passwordLoading = false;
        }
      });
  }

  /**
   * Handles address updates
   */
  onUpdateAddresses(): void {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      this.showMessage('Please fix the validation errors before submitting.', 'error');
      return;
    }

    this.addressLoading = true;
    this.message = null;

    const addresses: AddressDTO[] = this.addressesArray.value;

    // Create an array of observables for each address update/creation
    const addressObservables = addresses.map(address => {
      if (address.id) {
        // Update existing address
        return this.customerAddressesService.updateAddress(address);
      } else {
        // Create new address
        return this.customerAddressesService.createAddress(address);
      }
    });

    // Use forkJoin to wait for all address operations to complete
    forkJoin(addressObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showMessage('Addresses updated successfully!', 'success');
          this.toastService.showSuccess('Addresses updated successfully!');

          // Reload user profile to get updated addresses
          this.loadUserProfile();
        },
        error: (error) => {
          console.error('Failed to update addresses:', error);
          this.showMessage(this.getErrorMessage(error), 'error');
        },
        complete: () => {
          this.addressLoading = false;
        }
      });
  }

  /**
   * Resets the personal information form to the last saved values
   */
  resetPersonalForm(): void {
    if (this.user) {
      this.updateForm.patchValue({
        userName: this.user.userName || '',
        email: this.user.email || '',
        phone: this.user.phone || '',
        job: this.user.job || '',
        bd: this.user.bd || '',
        creditNo: this.user.creditNo || '',
        creditLimit: this.user.creditLimit || null
      });
      this.hasUnsavedChanges = false;
    }
  }

  /**
   * Resets the password form
   */
  resetPasswordForm(): void {
    this.passwordForm.reset();
  }

  /**
   * Resets the address form to the last saved values
   */
  resetAddressForm(): void {
    if (this.user) {
      this.populateAddresses(this.user.addresses || []);
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
   * Shows a message to the user
   */
  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (this.message === text) {
          this.message = null;
        }
      }, 5000);
    }
  }

  /**
   * Extracts error message from API response
   */
  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Checks if a form field is invalid and should show errors
   */
  isFieldInvalid(fieldPath: string): boolean {
    const field = this.updateForm.get(fieldPath);
    // Show errors if the field is invalid and either dirty, touched, or the form was submitted
    return !!(field && field.invalid && (field.dirty || field.touched || this.updateForm.dirty));
  }

  /**
   * Checks if a password field is invalid
   */
  isPasswordFieldInvalid(fieldPath: string): boolean {
    const field = this.passwordForm.get(fieldPath);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }


  getFieldError(fieldPath: string): string {
    const field = this.updateForm.get(fieldPath);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email address (e.g., user@example.com)';
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern'] && fieldPath === 'userName') return 'Username can only contain letters, numbers, and underscores (e.g., john_doe123)';
    if (errors['pattern']) return 'Invalid format';
    if (errors['invalidPhone']) return 'Please enter a valid phone number (e.g., +1234567890 or 123-456-7890)';
    if (errors['invalidCreditCard']) return 'Please enter a valid 16-digit credit card number (e.g., 1234-5678-9012-3456 or 1234567890123456)';
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['futureDate']) return 'Birth date cannot be in the future';
    if (errors['tooYoung']) return 'You must be at least 13 years old';

    return 'Invalid value';
  }


  getPasswordFieldError(fieldPath: string): string {
    const field = this.passwordForm.get(fieldPath);
    return this.getControlError(field);
  }

  private getControlError(control: AbstractControl | null): string {
    if (control && control.errors) {
      const errors = control.errors;

      if (errors['required']) return 'This field is required';
      if (errors['email']) return 'Please enter a valid email address';
      if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
      if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
      if (errors['pattern']) return 'Please enter a valid format';
      if (errors['min']) return `Value must be at least ${errors['min'].min}`;
      if (errors['max']) return `Value must be at most ${errors['max'].max}`;
      if (errors['invalidCreditCard']) return 'Please enter a valid 16-digit credit card number';
      if (errors['invalidPhone']) return 'Please enter a valid phone number';
      if (errors['weakPassword']) return 'Password must contain uppercase, lowercase, number, and special character';
      if (errors['futureDate']) return 'Birth date cannot be in the future';
      if (errors['tooYoung']) return 'You must be at least 13 years old';
      if (errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
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


  hasProfileChanges(): boolean {
    if (!this.user) return false;

    const currentValues = this.updateForm.getRawValue();

    return (
      currentValues.userName !== (this.user.userName || '') ||
      currentValues.email !== (this.user.email || '') ||
      currentValues.phone !== (this.user.phone || '') ||
      currentValues.job !== (this.user.job || '') ||
      currentValues.creditNo !== (this.user.creditNo || '') ||
      currentValues.creditLimit !== (this.user.creditLimit || null)
    );
  }

  /**
   * Creates an UpdateProfileDTO from form data
   */
  private createUpdateProfileDTO(formData: any): UpdateProfileDTO {
    return {
      userName: formData.userName,
      email: formData.email,
      job: formData.job,
      creditNo: formData.creditNo,
      creditLimit: formData.creditLimit,
      phone: formData.phone
    };
  }

  /**
   * Checks if the form is valid considering only enabled controls
   * and if there are any changes compared to the original data
   */
  isFormValid(form: FormGroup): boolean {
    // Check if all enabled controls are valid
    const allEnabledValid = Object.keys(form.controls)
      .filter(key => {
        const control = form.get(key);
        return control && !control.disabled;
      })
      .every(key => {
        const control = form.get(key);
        return control && control.valid;
      });

    // For the update form, also check if there are any changes
    if (form === this.updateForm) {
      return allEnabledValid && this.hasProfileChanges();
    }

    return allEnabledValid;
  }

}
