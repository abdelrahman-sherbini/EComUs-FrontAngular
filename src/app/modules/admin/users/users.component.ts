import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminUsersService } from '../../openapi/api/admin-users.service';
import { PagedResponseUserDTO } from '../../openapi/model/paged-response-user-dto';
import { UserDTO } from '../../openapi/model/user-dto';
import { OrderDTO } from '../../openapi/model/order-dto';
import { AddressDTO } from '../../openapi/model/address-dto';
import { CartDTO } from '../../openapi/model/cart-dto';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class UsersComponent implements OnInit, OnDestroy {
  // Pagination
  pagedResponse: PagedResponseUserDTO | null = null;
  users: UserDTO[] = [];
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Sorting
  sortField: 'userId' | 'userName' | 'email' | 'role' | 'job' | 'phone' | 'creditLimit' | 'BD' = 'userId';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtering
  searchKeyword = '';
  showAdvancedFilters = false;
  userIdFilter: number | null = null;
  userNameFilter = '';
  emailFilter = '';
  roleFilter: 'USER' | 'ADMIN' | '' = '';
  jobFilter = '';
  phoneFilter = '';
  creditLimitMin: number | null = null;
  creditLimitMax: number | null = null;

  // State
  loading = false;
  error: string | null = null;
  selectedUser: UserDTO | null = null;
  activeTab = 'info'; // For modal tabs: 'info', 'orders', 'carts', 'addresses'

  // Utility
  Math = Math;
  private destroy$ = new Subject<void>();

  constructor(private usersService: AdminUsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.usersService.getAllUsers(
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortDirection,
      this.searchKeyword || undefined,
      this.userIdFilter || undefined,
      this.userNameFilter || undefined,
      this.emailFilter || undefined,
      this.roleFilter || undefined,
      this.jobFilter || undefined,
      this.phoneFilter || undefined,
      this.creditLimitMin || undefined,  // Changed from creditLimitMax to creditLimitMin
      this.creditLimitMax || undefined   // Changed from creditLimitMin to creditLimitMax
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.users = response.content || [];
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  // Pagination handlers
  onPageChange(page: number): void {
    if (page !== this.currentPage && page > 0 && (!this.pagedResponse || page <= this.pagedResponse.totalPages!)) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.pageSize = Number(selectElement.value);
    this.currentPage = 1; // Reset to first page
    this.loadUsers();
  }

  getPaginationArray(): number[] {
    if (!this.pagedResponse || !this.pagedResponse.totalPages) return [];

    const totalPages = this.pagedResponse.totalPages;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  }

  // Sorting handlers
  onSort(field: 'userId' | 'userName' | 'email' | 'role' | 'job' | 'phone' | 'creditLimit' | 'BD'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadUsers();
  }

  // Filtering handlers
  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchKeyword = inputElement.value;
    this.currentPage = 1; // Reset to first page
    this.loadUsers();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyAdvancedFilters(): void {
    this.currentPage = 1; // Reset to first page
    this.loadUsers();
  }

  clearAdvancedFilters(): void {
    this.userIdFilter = null;
    this.userNameFilter = '';
    this.emailFilter = '';
    this.roleFilter = '';
    this.jobFilter = '';
    this.phoneFilter = '';
    this.creditLimitMin = null;
    this.creditLimitMax = null;

    if (this.searchKeyword) {
      this.searchKeyword = '';
    }

    this.currentPage = 1;
    this.loadUsers();
  }

  // User details handlers
  viewUserDetails(user: UserDTO): void {
    if (user.userId) {
      this.loading = true;
      this.usersService.getUserById(user.userId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (fullUser) => {
          this.selectedUser = fullUser;
          this.activeTab = 'info';
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user details:', error);
          this.selectedUser = user; // Fall back to basic user data
          this.loading = false;
        }
      });
    } else {
      this.selectedUser = user;
      this.activeTab = 'info';
    }
  }

  closeUserDetails(): void {
    this.selectedUser = null;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Utility methods
  trackByUserId(index: number, user: UserDTO): number {
    return user.userId || index;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getRoleBadgeClass(role?: string): string {
    if (!role) return 'badge bg-secondary';

    switch (role) {
      case 'ADMIN':
        return 'badge bg-danger';
      case 'USER':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }
}
