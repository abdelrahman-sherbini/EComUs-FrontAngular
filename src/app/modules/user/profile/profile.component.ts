import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../services/auth-service';
import {CustomerProfileService, UserDTO} from '../../openapi';
import {AsyncPipe, CommonModule, CurrencyPipe, DatePipe} from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [
    CurrencyPipe,
    DatePipe,
    AsyncPipe,
    CommonModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileData!: UserDTO;
  loading = false;
  error: string | null = null;

  constructor(
    public authService: AuthService,
    private customerProfileService: CustomerProfileService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    if (this.authService.isAuthenticated()) {
      this.loading = true;
      this.error = null;

      this.customerProfileService.profile().subscribe({
        next: (data: UserDTO) => {
          this.profileData = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load profile:', error);
          this.error = 'Failed to load profile data. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  getRoleBadgeClass(): string {
    if (!this.profileData?.role) return 'bg-secondary';

    switch (this.profileData.role) {
      case 'ADMIN':
        return 'bg-danger';
      case 'USER':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  maskCreditCard(creditNo: string): string {
    if (!creditNo || creditNo.length < 4) return creditNo;
    return '**** **** **** ' + creditNo.slice(-4);
  }

  trackByAddressId(index: number, address: any): any {
    return address.id || index;
  }
}
