import { Component, Input } from '@angular/core';
import { Modal } from 'bootstrap';
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
    price:0
  };
  quantity = 1;

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
    console.log('Add to cart:', this.product, 'Qty:', this.quantity);
  }
}
