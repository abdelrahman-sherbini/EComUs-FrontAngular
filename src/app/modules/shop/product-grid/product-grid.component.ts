import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {ProductDTO} from '../../openapi';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import { Offcanvas } from 'bootstrap';




@Component({
  selector: 'app-product-grid',
  imports: [
    NgForOf,
    NgClass,
    NgIf,
    RouterLink,
    FormsModule,
  ],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.css'
})
export class ProductGridComponent {
  @Input() products: any[] = [];
  @Input() gridClass: string = 'grid-4';

  @Output() quickView = new EventEmitter<any>();
  @Output() addProduct = new EventEmitter<any>();

  onQuickView(product: ProductDTO) {
    this.quickView.emit(product);
  }

  addToCart(product: any) {
    this.addProduct.emit(product);
  }

  @Output() quickAdd = new EventEmitter<ProductDTO>();
  onQuickAdd(product: ProductDTO) {
    this.quickAdd.emit(product);
  }

  categories = [
    { name: 'Socks', checked: false },
    { name: 'Shirts', checked: false }
  ];

  filter = {
    inStock: false,
    outOfStock: false,
    minPrice: null,
    maxPrice: null
  };

  applyFilter() {

  }

  clearFilters() {

  }

  openSidebar(): void {
    const sidebarElement = document.getElementById('filterSidebar');
    if (sidebarElement) {
      const sidebar = new Offcanvas(sidebarElement);
      sidebar.show();
    }
  }

  categoryOpen = true;
  availabilityOpen = false;
  priceOpen = false;

  toggleSection(section: string) {
    if (section === 'category') {
      this.categoryOpen = !this.categoryOpen;
    } else if (section === 'availability') {
      this.availabilityOpen = !this.availabilityOpen;
    } else if (section === 'price') {
      this.priceOpen = !this.priceOpen;
    }
  }

  getGridClasses(grid: string): string {
    switch (grid) {
      case 'grid-2': return 'col-6';
      case 'grid-3': return 'col-6 col-sm-4';
      case 'grid-4': return 'col-6 col-sm-4 col-md-3';
      case 'grid-6': return 'col-6 col-sm-4 col-md-3 col-lg-2';
      default: return 'col-6';
    }
  }
}
