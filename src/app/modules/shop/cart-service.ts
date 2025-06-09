import { Injectable } from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {ToastService} from '../../services/toast';
import {CustomerCartService, ShoppingCartDTO} from '../openapi';
import {catchError, EMPTY, Observable, tap} from 'rxjs';
import {PopupService} from '../../services/popup.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private customerCart: CustomerCartService,
    private popup: PopupService,
    private router: Router,
    ) {}

  addToCart(product: {productId: number, quantity: number}, requestedQuantity: number): Observable<any> {
    // 1. Auth check
    if (!this.auth.isAuthenticated()) {

      this.popup.showConfirm(
        'You must login to add to cart.',
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

    // 2. Stock check
    const available = product.quantity;
    if (available < requestedQuantity) {
      this.toast.showWarning(
        `Not enough stock available. ${available} in stock, you requested ${requestedQuantity}.`,
        'add to cart'
      );
      return EMPTY;
    }

    // 3. Add to cart via OpenAPI service
    const dto: ShoppingCartDTO = {
      productId: product.productId,
      quantity: requestedQuantity
    };

    return this.customerCart.addOrUpdateCartItem(dto).pipe(
      tap(() => {
        // Optionally: call another service to refresh cart count
        this.toast.showSuccess('Added to cart!', 'add to cart');
      }),
      catchError(() => {
        this.toast.showWarning('Could not add to cart. Try again.', 'add to cart');
        return EMPTY;
      })
    );
  }
}
