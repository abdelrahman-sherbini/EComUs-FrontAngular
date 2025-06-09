import { Component, OnInit } from '@angular/core';
import { CustomerProductsService, ProductDTO } from '../../openapi';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../cart-service';
import { ToastService } from '../../../services/toast';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf, NgIf} from '@angular/common';
import {ToastComponent} from '../../../components/toast/toast.component';
import {PopupComponent} from '../../../components/popup/popup.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    NgForOf,
    NgIf,
    ToastComponent,
    PopupComponent,
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  product: ProductDTO | null = null;
  loading = true;
  error: string | null = null;
  selectedQty = 1;
  mainImage = '';

  constructor(
    private route: ActivatedRoute,
    private productsService: CustomerProductsService,
    private cartService: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productsService.getProductById1(id).subscribe({
        next: (prod) => {
          this.product = prod;
          this.mainImage = prod.images?.[0] || 'assets/img/no-image.png';
          this.loading = false;
        },
        error: () => {
          this.error = 'Product not found or an error occurred.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid product ID.';
      this.loading = false;
    }
  }

  setMainImage(img: string) {
    this.mainImage = img;
  }

  changeQty(delta: number) {
    const max = this.product?.quantity || 1;
    this.selectedQty = Math.max(1, Math.min(this.selectedQty + delta, max));
  }

  addToCart() {
    if (!this.product || !this.product.productId) return;
    if (!this.product.quantity || this.selectedQty < 1 || this.selectedQty > this.product.quantity) {
      this.toast.showWarning('Invalid quantity or out of stock.');
      return;
    }
    this.cartService.addToCart(
      { productId: this.product.productId!, quantity: this.product.quantity!, name: this.product.productName! },
      this.selectedQty
    ).subscribe({
    });
  }

  addToWishlist() {
    this.toast.showInfo('Added to wishlist!');
  }

  get totalPrice(): number {
    return (this.product?.price ?? 0) * this.selectedQty;
  }

}
