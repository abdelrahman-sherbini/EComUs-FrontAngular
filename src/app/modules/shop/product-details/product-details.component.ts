import {Component, OnInit} from '@angular/core';
import {CustomerProductsService, ProductDTO} from '../../openapi';
import {ActivatedRoute} from '@angular/router';
import {CartService} from '../cart-service';
import {ToastService} from '../../../services/toast';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-product-details',
  imports: [
    FormsModule,
    NgClass,
    NgForOf,
    NgIf
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  product: ProductDTO | null = null;
  loading = true;
  error: string | null = null;
  selectedQty = 1;
  mainImage = 'assets/img/no-image.png';

  constructor(
    private route: ActivatedRoute,
    private productsService: CustomerProductsService,
    private cartService: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loading = true;
      this.error = null;
      this.productsService.getProductById1(id).subscribe({
        next: (prod) => {
          this.product = prod;
          this.mainImage = prod.images?.[0] || 'assets/img/no-image.png';
          this.selectedQty = 1;
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

  addToCart() {
    if (!this.product || !this.product.productId) return;
    if (!this.product.quantity || this.selectedQty < 1 || this.selectedQty > this.product.quantity) {
      this.toast.showWarning(' out of stock.');
      return;
    }
    this.cartService.addToCart(
      { productId: this.product.productId!, quantity: this.product.quantity! },
      this.selectedQty
    ).subscribe();
  }
}
