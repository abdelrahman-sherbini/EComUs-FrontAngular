import {Component, Input} from '@angular/core';
import {Modal} from 'bootstrap';
import {Router} from '@angular/router';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {ProductDTO} from '../../openapi';
import {CartService} from '../cart-service';
import {WishListService} from '../wish-list-service';

@Component({
  selector: 'app-quick-view-modal',
  imports: [
    NgForOf,
    NgIf,
    NgClass,
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

  constructor(
    private cartService: CartService,
    public wishListService: WishListService,
    private router: Router
  ) {}

  viewProductDetails(): void {
    if (this.modal) {
      this.modal.hide();

      // Clean up modal backdrop
      setTimeout(() => {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');

        // Navigate to product details page
        if (this.product.productId) {
          this.router.navigate(['/products/product/', this.product.productId]);
        }
      }, 150);
    }
  }

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

  changeQty(change: number) {
    const max = Math.max(this.product.quantity || 0, 0);
    let newQty = this.quantity + change;
    if (max === 0) {
      this.quantity = 0;
    } else {
      this.quantity = Math.max(1, Math.min(newQty, max));
    }
  }

  addToCart() {
    if (!this.product?.quantity) return;
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
      this.wishListService.add(this.product.productId, () => {
        // This runs if not authenticated (popup shown)
        this.closeModal();
      }).subscribe();
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.hide();
    }
  }
}
