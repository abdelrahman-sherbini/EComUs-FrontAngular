import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  CommonModule } from '@angular/common';
import { OrdersComponent } from './orders/orders.component';
import { UpdateAccountComponent } from './update-account/update-account.component';
import { AddressDTO } from '../../openapi';
import { WishlistComponent } from '../wishlist/wishlist.component';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import {AuthService} from '../../../services/auth-service';

interface UserProfile {
  userId: number;
  userName: string;
  email: string;
  job: string | null;
  creditNo: string | null;
  creditLimit: number | null;
  phone: string | null;
  role: string;
  addresses: AddressDTO[];
  orders: any[];
  carts: any[];
  bd: string | null;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    OrdersComponent,
    UpdateAccountComponent,
    WishlistComponent
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  loading = false;
  error: string | null = null;
  activeTab: string = 'account-details';
  private routerSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab']);
      }
    });

    // Load user profile initially
    this.loadUserProfile();

    // Subscribe to router events to reload data when navigating to this component
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Check if the current route is the account details route
      if (event.url.includes('/user/account')) {
        console.log('Navigated to account page, reloading data');
        this.loadUserProfile();
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadUserProfile() {
    this.loading = true;
    this.error = null;

    // Load user profile and addresses separately
    Promise.all([
      this.http.get<Omit<UserProfile, 'addresses'>>('http://localhost:8080/api/public/users/profile').toPromise(),
      this.http.get<AddressDTO[]>('http://localhost:8080/api/public/address').toPromise()
    ]).then(([userProfile, addresses]) => {
      this.user = {
        ...userProfile!,
        addresses: addresses || []
      };
      this.loading = false;
    }).catch((error) => {
      console.error('Failed to load profile:', error);
      this.error = 'Failed to load profile data. Please try again.';
      this.loading = false;
    });
  }

  setActiveTab(tab: string) {
    const previousTab = this.activeTab;
    this.activeTab = tab;

    // Handle logout
    if (tab === 'logout') {
      this.handleLogout();
      return;
    }

    // Reload user profile data when switching to account-details tab
    if (tab === 'account-details' && previousTab !== 'account-details') {
      this.loadUserProfile();
    }
  }

  private handleLogout() {
    // Implement logout logic here
    if (confirm('Are you sure you want to logout?')) {

      this.authService.logout().subscribe({
        next: () => {
          // Logout successful, navigation handled by auth service
        },
        error: (error) => {
          console.error('Logout error:', error);
        }
      });
    }
  }

  maskCreditCard(creditNo: string | null): string {
    if (!creditNo || creditNo.length < 4) return 'N/A';
    return '**** **** **** ' + creditNo.slice(-4);
  }

  formatCurrency(amount: number | null): string {
    if (!amount) return 'N/A';
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  getRoleBadgeClass(): string {
    if (!this.user?.role) return 'badge-secondary';

    switch (this.user.role.toUpperCase()) {
      case 'ADMIN':
        return 'badge-danger';
      case 'USER':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  }
}

// import { Component, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { NgClass, CommonModule } from '@angular/common';
// import { OrdersComponent } from './orders/orders.component';
// import { UpdateAccountComponent } from './update-account/update-account.component';
//
// interface UserProfile {
//   userId: number;
//   userName: string;
//   email: string;
//   job: string | null;
//   creditNo: string | null;
//   creditLimit: number | null;
//   phone: string | null;
//   role: string;
//   addresses: Address[];
//   orders: any[];
//   carts: any[];
//   bd: string | null;
// }
//
// interface Address {
//   id: number;
//   street: string;
//   city: string;
//   area: string;
//   buildingNo: string;
// }
//
// @Component({
//   selector: 'app-account',
//   standalone: true,
//   imports: [
//     NgClass,
//     CommonModule,
//     OrdersComponent,
//     UpdateAccountComponent
//   ],
//   templateUrl: './account.component.html',
//   styleUrls: ['./account.component.scss']
// })
// export class AccountComponent implements OnInit {
//   user: UserProfile | null = null;
//   loading = false;
//   error: string | null = null;
//   activeTab = 'account-details';
//
//   constructor(private http: HttpClient) {}
//
//   ngOnInit() {
//     this.loadUserProfile();
//   }
//
//   loadUserProfile() {
//     this.loading = true;
//     this.error = null;
//
//     this.http.get<UserProfile>('http://localhost:8080/api/public/users/profile')
//       .subscribe({
//         next: (data) => {
//           this.user = data;
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Failed to load profile:', error);
//           this.error = 'Failed to load profile data. Please try again.';
//           this.loading = false;
//         }
//       });
//   }
//
//   setActiveTab(tab: string) {
//     this.activeTab = tab;
//
//     // Handle logout
//     if (tab === 'logout') {
//       this.handleLogout();
//       return;
//     }
//   }
//
//   private handleLogout() {
//     // Implement logout logic here
//     if (confirm('Are you sure you want to logout?')) {
//       // Clear any stored tokens/session data
//       localStorage.removeItem('authToken');
//       // Redirect to login or home page
//       // this.router.navigate(['/login']);
//       console.log('User logged out');
//     }
//   }
//
//   maskCreditCard(creditNo: string | null): string {
//     if (!creditNo || creditNo.length < 4) return 'N/A';
//     return '**** **** **** ' + creditNo.slice(-4);
//   }
//
//   formatCurrency(amount: number | null): string {
//     if (!amount) return 'N/A';
//     return amount.toLocaleString('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     });
//   }
//
//   getRoleBadgeClass(): string {
//     if (!this.user?.role) return 'badge-secondary';
//
//     switch (this.user.role.toUpperCase()) {
//       case 'ADMIN':
//         return 'badge-danger';
//       case 'USER':
//         return 'badge-primary';
//       default:
//         return 'badge-secondary';
//     }
//   }
// }
//
