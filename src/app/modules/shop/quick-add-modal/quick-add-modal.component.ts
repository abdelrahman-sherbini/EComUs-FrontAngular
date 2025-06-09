import { Component, Input } from '@angular/core';
import { Modal } from 'bootstrap';
import {CustomerCartService, ProductDTO, ShoppingCartDTO} from '../../openapi';
import {AuthService} from '../../../services/auth-service';
import {ShoppingService} from '../../../services/shopping.service';
import {ToastService} from '../../../services/toast';
import {CartService} from '../cart-service';


@Component({
  selector: 'app-quick-add-modal',
  imports: [],
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

  constructor(
    private cartService: CartService
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

    const modal = new Modal(document.getElementById('quickAddModal')!);
    modal.show();
  }

  addToCart() {
    this.cartService.addToCart(
      { productId: this.product.productId!, quantity: this.product.quantity! },
      this.quantity
    ).subscribe();
  }
}
