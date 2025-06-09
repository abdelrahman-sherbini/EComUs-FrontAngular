import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  private cartItemsCountSubject = new BehaviorSubject<number>(0);
  private wishlistItemsCountSubject = new BehaviorSubject<number>(0);

  public cartItemsCount$: Observable<number> = this.cartItemsCountSubject.asObservable();
  public wishlistItemsCount$: Observable<number> = this.wishlistItemsCountSubject.asObservable();

  constructor() {
    // Initialize from localStorage if available
    this.initCounts();
  }

  private initCounts(): void {
    try {
      const cartCount = localStorage.getItem('cart_count');
      const wishlistCount = localStorage.getItem('wishlist_count');
      
      if (cartCount) this.cartItemsCountSubject.next(parseInt(cartCount, 10));
      if (wishlistCount) this.wishlistItemsCountSubject.next(parseInt(wishlistCount, 10));
    } catch (error) {
      console.error('Failed to load counts from storage:', error);
    }
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
}