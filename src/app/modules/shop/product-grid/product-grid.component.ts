import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {CategoryDTO, ProductDTO} from '../../openapi';
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
  @Input() products: ProductDTO[] = [];
  @Input() gridClass: string = 'grid-4';
  @Input() categories: CategoryDTO[] = [];

  @Output() quickView = new EventEmitter<any>();
  @Output() addProduct = new EventEmitter<any>();
  @Output() filterApplied = new EventEmitter<any>();
  @Output() quickAdd = new EventEmitter<ProductDTO>();

  filter: {
    categories: string[];
    stockStatus: undefined | 'inStock' | 'outOfStock',
    minPrice: number | undefined;
    maxPrice: number | undefined;
  } = {
    categories: [],
    stockStatus: undefined,
    minPrice: undefined,
    maxPrice: undefined
  };
  private sidebar: Offcanvas | undefined;

  onQuickView(product: ProductDTO) {
    this.quickView.emit(product);
  }

  addToCart(product: any) {
    this.addProduct.emit(product);
  }

  onQuickAdd(product: ProductDTO) {
    this.quickAdd.emit(product);
  }

  applyFilter() {
    this.filterApplied.emit(this.filter); // or your filter model
    this.closeSidebar(); // Close the sidebar after applying the filter
  }

  clearFilters() {
    this.filter = {
      categories: [],
      stockStatus: undefined,
      minPrice: undefined,
      maxPrice: undefined
    };
    this.filterApplied.emit(this.filter); // Emit empty filter to clear
    this.closeSidebar(); // Close the sidebar after applying the filter

  }

  openSidebar(): void {
    const sidebarElement = document.getElementById('filterSidebar');
    if (sidebarElement) {
      this.sidebar = new Offcanvas(sidebarElement);
      this.sidebar.show();
    }
  }
  closeSidebar(): void {
    if (this.sidebar) {
      this.sidebar.hide();
    }
  }

  categoryOpen = true;
  availabilityOpen = true;
  priceOpen = true;

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

  onCategoryChange(event: any, categoryName: string) {
    if (event.target.checked) {
      this.filter.categories.push(categoryName);
    } else {
      this.filter.categories = this.filter.categories.filter(c => c !== categoryName);
    }
  }
}
