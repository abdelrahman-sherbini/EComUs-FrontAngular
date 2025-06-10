import { Component, Input } from '@angular/core';
import { Modal } from 'bootstrap';
import {CartService} from '../cart-service';
import {ProductDTO} from '../../openapi';
import {WishListService} from '../wish-list-service';
import {NgClass} from '@angular/common';


@Component({
  selector: 'app-quick-add-modal',
  imports: [
    NgClass
  ],
  templateUrl: './quick-add-modal.component.html',
  styleUrl: './quick-add-modal.component.css'
})
export class QuickAddModalComponent {
  @Input() product:  ProductDTO = {
    productName: '',
    description: '',
    images: [],
    price:0,
    quantity:0
  };

  quantity = 1;
  private modal: Modal | undefined ;

  constructor(
    private cartService: CartService,
    public wishListService: WishListService // ← Add this
  ) {}




  get total(): number {
    return this.quantity * (this.product?.price ?? 0);
  }

  increase() {
    this.quantity++;
  }

  decrease() {
    if (this.quantity > 1) this.quantity--;
  }

  open(product: any) {
    this.product = product;
    this.quantity = 1;

    this.modal = new Modal(document.getElementById('quickAddModal')!);
    this.modal.show();
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
