import { Component, Input } from '@angular/core';
import { Modal } from 'bootstrap';
import {CartService} from '../cart-service';
import {ProductDTO} from '../../openapi';


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
  private modal: Modal | undefined ;

  constructor(private cartService: CartService) {}



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
}
