import { Injectable } from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {ToastService} from '../../services/toast';
import {PopupService} from '../../services/popup.service';
import {Router} from '@angular/router';
import {catchError, EMPTY, map, Observable, of, tap} from 'rxjs';
import {CustomerWishlistService} from '../openapi';

@Injectable({
  providedIn: 'root'
})
export class WishListService {

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private wishlistService: CustomerWishlistService,
    private popup: PopupService,
    private router: Router
  ) {}

  /**
   * Add a product to the user's wishlist.
   * @param productId - The product ID to add.
   */
  add(productId: number): Observable<any> {
    if (!this.auth.isAuthenticated()) {
      this.popup.showConfirm(
        'You must login to add to wishlist.',
        [
          {
            text: 'Cancel',
            value: 'cancel',
            style: 'secondary'
          },
          {
            text: 'Login',
            value: 'login',
            style: 'primary',
            action: () => this.router.navigate(['/login'])
          }
        ],
        'Login Required'
      );
      return EMPTY;
    }

    return this.wishlistService.add(productId).pipe(
      tap(() => this.toast.showSuccess('Added to your wishlist!')),
      catchError((err) => {
        this.toast.showError(
          err?.error?.message || 'Could not add to wishlist.'
        );
        return EMPTY;
      })
    );
  }

  /**
   * Remove a product from the user's wishlist.
   * @param productId - The product ID to remove.
   */
  remove(productId: number): Observable<any> {
    if (!this.auth.isAuthenticated()) {
      this.toast.showWarning('You must login to remove from wishlist.');
      this.router.navigate(['/login']);
      return EMPTY;
    }

    return this.wishlistService._delete(productId).pipe(
      tap(() => this.toast.showSuccess('Removed from your wishlist.')),
      catchError((err) => {
        this.toast.showError(
          err?.error?.message || 'Could not remove from wishlist.'
        );
        return EMPTY;
      })
    );
  }

  isWishlisted(productId: number): Observable<boolean> {
    if (!this.auth.isAuthenticated()) {
      return of(false);
    }
    return this.wishlistService.getById(productId).pipe(
      map((item) => !!item),         // If we get a WishlistDTO, return true
      catchError(() => of(false))    // If error (404/not found), return false
    );
  }
}

