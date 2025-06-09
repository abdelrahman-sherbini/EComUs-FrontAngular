import {Component, Input} from '@angular/core';
import {Modal} from 'bootstrap';
import {RouterLink} from '@angular/router';
import {NgForOf, NgIf} from '@angular/common';
import {ProductDTO} from '../../openapi';

@Component({
  selector: 'app-quick-view-modal',
  imports: [
    RouterLink,
    NgForOf,
    NgIf
  ],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.css'
})
export class QuickViewModalComponent {
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

  open(product: any) {
    this.product = product;
    this.quantity = 1;

    const modalEl = document.getElementById('quickViewModal');
    if (modalEl) {
      const modal = new Modal(modalEl);
      modal.show();
    }
  }

  increase() {
    this.quantity++;
  }

  decrease() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    console.log('Added to cart:', this.product, this.quantity);
  }
}
