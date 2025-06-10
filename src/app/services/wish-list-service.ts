import { Injectable } from '@angular/core';
import {AuthService} from './auth-service';
import {ToastService} from './toast';
import {PopupService} from './popup.service';
import {Router} from '@angular/router';
import {BehaviorSubject, catchError, EMPTY, map, Observable, of, tap} from 'rxjs';
import {CustomerWishlistService, PagedResponseProductDTO, ProductDTO} from '../modules/openapi';
import {ShoppingService} from "./shopping.service";

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

    if (this.auth.authState$) {
      this.auth.authState$.subscribe(isAuthenticated => {
        if (!isAuthenticated) {
          this.wishlistProductsSubject.next([]);
        } else {
          this.refreshWishlist();
        }
      });
    }
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
  add(productId: number, notAuthCallback?: () => void): Observable<any> {
    if (!this.auth.isAuthenticated()) {
      this.popup.showConfirm(
        'You must login to add to wishlist.',
        [
          { text: 'Cancel', value: 'cancel', style: 'secondary' },
          { text: 'Login', value: 'login', style: 'primary', action: () => this.router.navigate(['/login']) }
        ],
        'Login Required'
      );
      if (notAuthCallback) notAuthCallback();
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
    if (!this.auth.isAuthenticated()) {
      return false; // Not authenticated, cannot be wishlisted
    }
    return this.wishlistProductsSubject.value.some(p => p.productId === productId);
  }

  /** (If you need async version for guards, etc.) */
  isWishlisted$(productId: number): Observable<boolean> {
    return this.wishlistProducts$.pipe(
      map(products => products.some(p => p.productId === productId))
    );
  }

  /** Returns all wishlist ProductDTOs (sync) */
  getAllWishlistedProducts(): ProductDTO[] {
    return this.wishlistProductsSubject.value;
  }

  /** Returns all wishlist ProductDTOs as observable */
  getAllWishlistedProducts$(): Observable<ProductDTO[]> {
    return this.wishlistProducts$;
  }

  /** Returns all wishlisted product IDs (sync) */
  getWishlistedProductIds(): number[] {
    return this.wishlistProductsSubject.value.map(p => p.productId!);
  }

  /** Returns all wishlisted product IDs as observable */
  getWishlistedProductIds$(): Observable<number[]> {
    return this.wishlistProducts$.pipe(
      map(products => products.map(p => p.productId!))
    );
  }

  /** Returns a mapping for a list of IDs: { id: true/false } */
  areWishlisted(productIds: number[]): { [id: number]: boolean } {
    const set = new Set(this.getWishlistedProductIds());
    const result: { [id: number]: boolean } = {};
    productIds.forEach(id => result[id] = set.has(id));
    return result;
  }

  /** Returns the number of products in the wishlist (sync) */
  getWishlistCount(): number {
    return this.wishlistProductsSubject.value.length;
  }

  /** Returns the number of products in the wishlist (observable) */
  getWishlistCount$(): Observable<number> {
    return this.wishlistProducts$.pipe(map(arr => arr.length));
  }
}
