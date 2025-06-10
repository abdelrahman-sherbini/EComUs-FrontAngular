import { Injectable } from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {ToastService} from '../../services/toast';
import {PopupService} from '../../services/popup.service';
import {Router} from '@angular/router';
import {BehaviorSubject, catchError, EMPTY, map, Observable, of, tap} from 'rxjs';
import {CustomerWishlistService, PagedResponseProductDTO, ProductDTO} from '../openapi';
import {ShoppingService} from "../../services/shopping.service";

@Injectable({
  providedIn: 'root'
})
export class WishListService {

  private wishlistProductsSubject = new BehaviorSubject<ProductDTO[]>([]);
  public wishlistProducts$ = this.wishlistProductsSubject.asObservable();

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private wishlistService: CustomerWishlistService,
    private popup: PopupService,
    private router: Router,
    private shoppingService: ShoppingService
  ) {
    if (this.auth.isAuthenticated()) {
      this.refreshWishlist();
    }
    // You may want to subscribe to login/logout events here to refresh/clear the list
  }

  /** Loads all wishlist products for the current user */
  refreshWishlist() {
    if (!this.auth.isAuthenticated()) {
      this.wishlistProductsSubject.next([]);
      return;
    }
    this.wishlistService.getWishItems().pipe(
      map((paged: PagedResponseProductDTO) => paged.content ?? []),
      catchError(() => of([]))
    ).subscribe(products => {
      this.wishlistProductsSubject.next(products);
    });
  }

  /** Add a product to wishlist and refresh local list */
  add(productId: number): Observable<any> {
    if (!this.auth.isAuthenticated()) {
      this.popup.showConfirm(
        'You must login to add to wishlist.',
        [
          { text: 'Cancel', value: 'cancel', style: 'secondary' },
          { text: 'Login', value: 'login', style: 'primary', action: () => this.router.navigate(['/login']) }
        ],
        'Login Required'
      );
      return EMPTY;
    }

    return this.wishlistService.add(productId).pipe(
      tap(() => {
        this.shoppingService.incrementWishlistCount()
        this.toast.showSuccess('Added to your wishlist!');
        this.refreshWishlist(); // Refresh the list after add
      }),
      catchError((err) => {
        this.toast.showError(
          err?.error?.message || 'Could not add to wishlist.'
        );
        return EMPTY;
      })
    );
  }

  /** Remove a product from wishlist and refresh local list */
  remove(productId: number): Observable<any> {
    if (!this.auth.isAuthenticated()) {
      this.toast.showWarning('You must login to remove from wishlist.');
      this.router.navigate(['/login']);
      return EMPTY;
    }

    return this.wishlistService._delete(productId).pipe(
      tap(() => {
        this.shoppingService.decrementWishlistCount()
        this.toast.showSuccess('Removed from your wishlist.');
        this.refreshWishlist(); // Refresh the list after remove
      }),
      catchError((err) => {
        this.toast.showError(
          err?.error?.message || 'Could not remove from wishlist.'
        );
        return EMPTY;
      })
    );
  }

  /** Checks if a product is in the local wishlist */
  isWishlisted(productId: number): boolean {
    return this.wishlistProductsSubject.value.some(p => p.productId === productId);
  }

  /** (If you need async version for guards, etc.) */
  isWishlisted$(productId: number): Observable<boolean> {
    return this.wishlistProducts$.pipe(
      map(products => products.some(p => p.productId === productId))
    );
  }
}
