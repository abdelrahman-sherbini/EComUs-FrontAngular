import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Import the generated services and DTOs
import { CustomerProfileService } from '../../../openapi/api/customer-profile.service';
import { UserDTO } from '../../../openapi/model/user-dto';
import { UpdateProfileDTO } from '../../../openapi/model/update-profile-dto';
import { ChangePasswordDTO } from '../../../openapi/model/change-password-dto';
import { AddressDTO } from '../../../openapi/model/address-dto';

// Custom validator functions for better form validation
export class CustomValidators {
  static creditCardNumber(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    // Remove spaces and hyphens
    const cleanValue = value.replace(/[\s-]/g, '');

    // Check if it's 16 digits
    if (!/^\d{16}$/.test(cleanValue)) {
      return { 'invalidCreditCard': true };
    }

    // Simple Luhn algorithm check
    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanValue.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanValue.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return (sum % 10 === 0) ? null : { 'invalidCreditCard': true };
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
    private fb: FormBuilder,
    private customerProfileService: CustomerProfileService
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
   * Based on UpdateProfileDTO structure: userName, email, job, creditNo, creditLimit, phone
   */
  private createUpdateForm(): FormGroup {
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
      phone: ['', [CustomValidators.phoneNumber]],
      job: ['', [Validators.maxLength(100)]],
      creditNo: ['', [CustomValidators.creditCardNumber]],
      creditLimit: [null, [Validators.min(0), Validators.max(1000000)]],
      // Note: Birth date (bd) is not part of UpdateProfileDTO, so it's handled separately
      bd: ['', [this.dateValidator]]
    });
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
   * Custom validator for birth date
   */
  private dateValidator(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (birthDate > today) {
      return { 'futureDate': true };
    }

    if (age < 13) {
      return { 'tooYoung': true };
    }

    return null;
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
      addressesArray.removeAt(index);
    }
  }

  /**
   * Handles profile update using UpdateProfileDTO
   * Only includes fields that are part of the DTO: userName, email, job, creditNo, creditLimit, phone
   */
  async onUpdateProfile(): Promise<void> {
    if (this.updateForm.invalid) {
      this.markFormGroupTouched(this.updateForm);
      this.showMessage('Please fix the validation errors before submitting.', 'error');
      return;
    }

    this.loading = true;
    this.message = null;

    try {
      const formData = this.updateForm.value;

      // Create UpdateProfileDTO with only the fields it supports
      const updatePayload: UpdateProfileDTO = {
        userName: formData.userName,
        email: formData.email
      };

      // Add optional fields only if they have values
      if (formData.phone && formData.phone.trim()) {
        updatePayload.phone = formData.phone.trim();
      }

      if (formData.job && formData.job.trim()) {
        updatePayload.job = formData.job.trim();
      }

      if (formData.creditNo && formData.creditNo.trim()) {
        updatePayload.creditNo = formData.creditNo.trim();
      }

      if (formData.creditLimit !== null && formData.creditLimit !== undefined) {
        updatePayload.creditLimit = formData.creditLimit;
      }

      await this.customerProfileService.updateProfile(updatePayload)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      this.showMessage('Profile updated successfully!', 'success');
      this.hasUnsavedChanges = false;

      // Reload user profile to get updated data
      this.loadUserProfile();

    } catch (error: any) {
      console.error('Failed to update profile:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Separate method to handle birth date update
   * Since 'bd' is not part of UpdateProfileDTO, this might need a different endpoint
   */
  async onUpdateBirthDate(): Promise<void> {
    const bdControl = this.updateForm.get('bd');

    if (!bdControl || bdControl.invalid) {
      bdControl?.markAsTouched();
      this.showMessage('Please enter a valid birth date.', 'error');
      return;
    }

    this.loading = true;
    this.message = null;

    try {
      // You might need a separate endpoint for birth date or include it in a different DTO
      // For now, this is a placeholder - replace with actual API call
      console.log('Birth date update:', bdControl.value);

      // If you have a separate endpoint for birth date:
      // await this.customerProfileService.updateBirthDate({ bd: bdControl.value })
      //   .pipe(takeUntil(this.destroy$))
      //   .toPromise();

      this.showMessage('Birth date updated successfully!', 'success');

    } catch (error: any) {
      console.error('Failed to update birth date:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handles password change
   */
  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      this.showMessage('Please fix the validation errors before submitting.', 'error');
      return;
    }

    this.passwordLoading = true;
    this.message = null;

    try {
      const formData = this.passwordForm.value;
      const changePasswordPayload: ChangePasswordDTO = {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      };

      await this.customerProfileService.updatePassword(changePasswordPayload)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      this.showMessage('Password changed successfully!', 'success');
      this.passwordForm.reset();
    } catch (error: any) {
      console.error('Failed to change password:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    } finally {
      this.passwordLoading = false;
    }
  }

  /**
   * Handles address updates
   */
  async onUpdateAddresses(): Promise<void> {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      this.showMessage('Please fix the validation errors before submitting.', 'error');
      return;
    }

    this.addressLoading = true;
    this.message = null;

    try {
      const addresses = this.addressesArray.value;

      // You'll need to implement address update logic here
      // This might involve calling a separate addresses endpoint
      console.log('Updating addresses:', addresses);

      this.showMessage('Addresses updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to update addresses:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    } finally {
      this.addressLoading = false;
    }
  }

  /**
   * Resets the form to original user data
   */
  resetForm(): void {
    if (this.user) {
      this.populateForm(this.user);
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
   * Resets the address form
   */
  resetAddressForm(): void {
    if (this.user) {
      this.populateAddresses(this.user.addresses || []);
    }
  }

  /**
   * Marks all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Shows a message to the user
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;

    // Auto-hide message after a delay
    setTimeout(() => {
      this.message = null;
    }, type === 'success' ? 5000 : 8000);
  }

  /**
   * Extracts error message from API response
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Checks if a form field is invalid and should show errors
   */
  isFieldInvalid(fieldPath: string): boolean {
    const field = this.updateForm.get(fieldPath);
    return !!(field && field.invalid && (field.dirty || field.touched));
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
    return this.getControlError(field);
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

    const currentValues = this.updateForm.value;

    return (
      currentValues.userName !== (this.user.userName || '') ||
      currentValues.email !== (this.user.email || '') ||
      currentValues.phone !== (this.user.phone || '') ||
      currentValues.job !== (this.user.job || '') ||
      currentValues.creditNo !== (this.user.creditNo || '') ||
      currentValues.creditLimit !== (this.user.creditLimit || null) ||
      currentValues.bd !== (this.user.bd || '')
    );
  }

  /**
   * Helper method to create UpdateProfileDTO from form data
   */
  private createUpdateProfileDTO(formData: any): UpdateProfileDTO {
    const dto: UpdateProfileDTO = {
      userName: formData.userName,
      email: formData.email
    };

    // Add optional fields only if they exist and are not empty
    if (formData.phone && formData.phone.trim()) {
      dto.phone = formData.phone.trim();
    }

    if (formData.job && formData.job.trim()) {
      dto.job = formData.job.trim();
    }

    if (formData.creditNo && formData.creditNo.trim()) {
      dto.creditNo = formData.creditNo.trim();
    }

    if (formData.creditLimit !== null && formData.creditLimit !== undefined) {
      dto.creditLimit = formData.creditLimit;
    }

    return dto;
  }


}
