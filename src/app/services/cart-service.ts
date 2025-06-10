import {Injectable} from '@angular/core';
import {AuthService} from './auth-service';
import {ToastService} from './toast';
import {CustomerCartService, ShoppingCartDTO} from '../modules/openapi';
import {catchError, EMPTY, Observable, of, switchMap, tap} from 'rxjs';
import {PopupService} from './popup.service';
import {Router} from '@angular/router';
import {ShoppingService} from './shopping.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor(
    private shoppingService: ShoppingService,
    private auth: AuthService,
    private toast: ToastService,
    private cartService: CustomerCartService,
    private popup: PopupService,
    private router: Router,
  ) {
  }

  addToCart(product: {
    productId: number,
    quantity: number,
    name: string
  }, requestedQuantity: number): Observable<any> {
    if (!this.auth.isAuthenticated()) {
      this.popup.showConfirm(
        'You must login to add to cart.',
        [
          { text: 'Cancel', value: 'cancel', style: 'secondary' },
          { text: 'Login', value: 'login', style: 'primary', action: () => this.router.navigate(['/login']) }
        ],
        'Login Required'
      );
      return EMPTY;
    }

    return this.cartService.getCartItem(product.productId).pipe(
      catchError(() => of({ quantity: 0 })),
      switchMap((cartItem) => {
        const existingQuantity = cartItem?.quantity || 0;
        const totalRequestedQuantity = existingQuantity + requestedQuantity;

        const available = product.quantity;

        if (available < totalRequestedQuantity) {
          if (existingQuantity > 0) {
            const remainingAvailable = available - existingQuantity;
            this.toast.showWarning(
              `You already have ${existingQuantity} in cart. Only ${remainingAvailable} more can be added (${available} total available).`,
              'Not enough stock available.'
            );
          } else {
            this.toast.showWarning(
              `${available} in stock, you requested ${requestedQuantity}.`,
              'Not enough stock available.'
            );
          }
          return EMPTY;
        }

        const dto: ShoppingCartDTO = {
          productId: product.productId,
          quantity: requestedQuantity
        };

        return this.cartService.addOrUpdateCartItem(dto).pipe(
          tap(() => {
            this.shoppingService.incrementCartCount(requestedQuantity);
            this.toast.showSuccess(product.name, 'add to cart');
          }),
          catchError(() => {
            this.toast.showWarning('Could not add: ' + product.name + ' to cart. Try again.', 'add to cart');
            return EMPTY;
          })
        );
      })
    );
  }
}
