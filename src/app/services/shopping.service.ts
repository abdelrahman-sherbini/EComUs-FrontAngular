import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError } from 'rxjs';
import { AuthService } from './auth-service';
import { CustomerCartService } from '../modules/openapi/api/customer-cart.service';
import { CustomerWishlistService } from '../modules/openapi/api/customer-wishlist.service';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  private cartItemsCountSubject = new BehaviorSubject<number>(0);
  private wishlistItemsCountSubject = new BehaviorSubject<number>(0);

  public cartItemsCount$: Observable<number> = this.cartItemsCountSubject.asObservable();
  public wishlistItemsCount$: Observable<number> = this.wishlistItemsCountSubject.asObservable();

  constructor(
    private authService: AuthService,
    private cartService: CustomerCartService,
    private wishlistService: CustomerWishlistService
  ) {
    // Initialize counts based on authentication state
    this.initCounts();

    // Subscribe to auth state changes to update counts
    this.authService.authState$.subscribe(state => {
      if (state.isAuthenticated) {
        this.fetchRealCounts();
      } else {
        // Reset counts to zero or local storage values when logged out
        this.resetCounts();
      }
    });
  }

  private initCounts(): void {
    try {
      // First try to get counts from localStorage
      const cartCount = localStorage.getItem('cart_count');
      const wishlistCount = localStorage.getItem('wishlist_count');

      if (cartCount) this.cartItemsCountSubject.next(parseInt(cartCount, 10));
      if (wishlistCount) this.wishlistItemsCountSubject.next(parseInt(wishlistCount, 10));

      // If authenticated, fetch real counts from API
      if (this.authService.isAuthenticated()) {
        this.fetchRealCounts();
      }
    } catch (error) {
      console.error('Failed to load counts from storage:', error);
    }
  }

  private fetchRealCounts(): void {
    // Fetch cart count
    this.cartService.getTotalQuantity()
      .pipe(
        catchError(error => {
          console.error('Failed to fetch cart count:', error);
          return of(0);
        })
      )
      .subscribe(count => {
        this.updateCartCount(count);
      });

    // Fetch wishlist count - get first page with size 1 to get totalElements
    this.wishlistService.getWishItems(1, 1)
      .pipe(
        catchError(error => {
          console.error('Failed to fetch wishlist count:', error);
          return of({ totalElements: 0 });
        })
      )
      .subscribe(response => {
        const count = response.totalElements || 0;
        this.updateWishlistCount(count);
      });
  }

  private resetCounts(): void {
    // When logged out, reset to zero or localStorage values
    const cartCount = localStorage.getItem('cart_count');
    const wishlistCount = localStorage.getItem('wishlist_count');

    this.cartItemsCountSubject.next(cartCount ? parseInt(cartCount, 10) : 0);
    this.wishlistItemsCountSubject.next(wishlistCount ? parseInt(wishlistCount, 10) : 0);
  }

  updateCartCount(count: number): void {
    this.cartItemsCountSubject.next(count);
    localStorage.setItem('cart_count', count.toString());
  }

  incrementCartCount(amount: number = 1): void {
    const currentCount = this.cartItemsCountSubject.value;
    this.updateCartCount(currentCount + amount);
  }

  decrementCartCount(amount: number = 1): void {
    const currentCount = this.cartItemsCountSubject.value;
    const newCount = Math.max(0, currentCount - amount);
    this.updateCartCount(newCount);
  }

  updateWishlistCount(count: number): void {
    this.wishlistItemsCountSubject.next(count);
    localStorage.setItem('wishlist_count', count.toString());
  }

  incrementWishlistCount(amount: number = 1): void {
    const currentCount = this.wishlistItemsCountSubject.value;
    this.updateWishlistCount(currentCount + amount);
  }

  decrementWishlistCount(amount: number = 1): void {
    const currentCount = this.wishlistItemsCountSubject.value;
    const newCount = Math.max(0, currentCount - amount);
    this.updateWishlistCount(newCount);
  }

  // Method to refresh counts (can be called after adding/removing items)
  refreshCounts(): void {
    if (this.authService.isAuthenticated()) {
      this.fetchRealCounts();
    }
  }
}
