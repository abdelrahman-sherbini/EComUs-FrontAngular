import { Component, OnInit } from '@angular/core';
import { CustomerProductsService, ProductDTO } from '../../openapi';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../cart-service';
import { ToastService } from '../../../services/toast';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf, NgIf} from '@angular/common';
import {ToastComponent} from '../../../components/toast/toast.component';
import {PopupComponent} from '../../../components/popup/popup.component';
import {WishListService} from '../wish-list-service';

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
  totalPrice = 0;
  isWishlisted = false;
  wishlistLoading = false;


  constructor(
    private route: ActivatedRoute,
    private productsService: CustomerProductsService,
    private cartService: CartService,
    private toast: ToastService,
    private wishlistService: WishListService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productsService.getProductById1(id).subscribe({
        next: (prod) => {
          this.product = prod;
          this.mainImage = prod.images?.[0] || 'assets/img/no-image.png';
          this.selectedQty = 1;
          this.updateTotal();
          this.loading = false;
          this.checkIfWishlisted()

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

  changeQty(change: number) {
    if (!this.product) return;
    const max = this.product.quantity ?? 1;
    this.selectedQty = Math.max(1, Math.min(this.selectedQty + change, max));
    this.updateTotal();
  }

  updateTotal() {
    this.totalPrice = this.product ? (this.product.price ?? 0) * this.selectedQty : 0;
  }

  addToCart() {
    if (!this.product || !this.product.productId) return;
    if (!this.product.quantity || this.selectedQty < 1 || this.selectedQty > this.product.quantity) {
      this.toast.showWarning('Invalid quantity or out of stock.');
      return;
    }
    this.cartService.addToCart(
      {productId: this.product.productId!, quantity: this.product.quantity!, name: this.product.productName!},
      this.selectedQty
    ).subscribe({});
  }

  checkIfWishlisted() {
    if (this.product?.productId) {
      this.wishlistService.isWishlisted$(this.product.productId)
        .subscribe((isInList: boolean) => this.isWishlisted = isInList);
    }
  }

  toggleWishlist() {
    if (!this.product?.productId || this.wishlistLoading) return;
    this.wishlistLoading = true;
    if (this.isWishlisted) {
      this.wishlistService.remove(this.product.productId).subscribe({
        next: () => {
          this.checkIfWishlisted();
          this.wishlistLoading = false;
        },
        error: () => { this.wishlistLoading = false; }
      });
    } else {
      this.wishlistService.add(this.product.productId).subscribe({
        next: () => {
          this.checkIfWishlisted();
          this.wishlistLoading = false;
        },
        error: () => { this.wishlistLoading = false; }
      });
    }
  }
}

