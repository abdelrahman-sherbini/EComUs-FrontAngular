import {Component, Input} from '@angular/core';
import {Modal} from 'bootstrap';
import {RouterLink} from '@angular/router';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {ProductDTO} from '../../openapi';
import {CartService} from '../cart-service';
import {WishListService} from '../wish-list-service';

@Component({
  selector: 'app-quick-view-modal',
  imports: [
    RouterLink,
    NgForOf,
    NgIf,
    NgClass
  ],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.css'
})
export class QuickViewModalComponent {
  @Input() product: ProductDTO = {
    productName: '',
    description: '',
    images: [],
    price: 0
  };
  quantity = 1;
  private modal: Modal | undefined;

  constructor(private cartService: CartService, public wishListService: WishListService) {}

  get total(): number {
    return this.quantity * (this.product?.price ?? 0);
  }

  open(product: any) {
    this.product = product;
    this.quantity = 1;

    const modalEl = document.getElementById('quickViewModal');
    if (modalEl) {
      this.modal = new Modal(modalEl);
      this.modal.show();
    }
  }

  increase() {
    this.quantity++;
  }

  decrease() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    if (this.modal) {
      this.modal.hide();
    }
    this.cartService.addToCart(
      { productId: this.product.productId!, quantity: this.product.quantity!, name: this.product.productName! },
      this.quantity
    ).subscribe();
  }
  isWishlisted(): boolean {
    return !!(this.product && this.product.productId && this.wishListService.isWishlisted(this.product.productId));
  }

  onWishlistClick() {
    if (!this.product?.productId) return;
    if (this.isWishlisted()) {
      this.wishListService.remove(this.product.productId).subscribe();
    } else {
      this.wishListService.add(this.product.productId).subscribe();
    }
  }
}
