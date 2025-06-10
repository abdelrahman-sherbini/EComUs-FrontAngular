import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {CategoryDTO, ProductDTO} from '../../openapi';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Offcanvas} from 'bootstrap';
import {WishListService} from '../../../services/wish-list-service';


@Component({
  selector: 'app-product-grid',
  imports: [
    FormsModule,
    NgClass,
    RouterLink,
    NgIf,
    NgForOf,
  ],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.scss'
})
export class ProductGridComponent implements OnInit {

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
  categoryOpen = true;
  availabilityOpen = true;
  priceOpen = true;
  wishlistedMap: { [productId: number]: boolean } = {};
  @Input() products: ProductDTO[] = [];
  @Input() gridClass: string = 'grid-4';
  @Input() categories: CategoryDTO[] = [];
  @Output() wishlistToggled = new EventEmitter<ProductDTO>();
  @Output() quickView = new EventEmitter<any>();
  @Output() addProduct = new EventEmitter<any>();
  @Output() filterApplied = new EventEmitter<any>();
  @Output() quickAdd = new EventEmitter<ProductDTO>();
  private sidebar: Offcanvas | undefined;

  constructor(public wishListService: WishListService) {
  }

  @Input() isWishlisted: (product: ProductDTO) => boolean = () => false;

  ngOnInit() {
    // Subscribe to wishlist updates to keep icons in sync
    this.wishListService.wishlistProducts$.subscribe(products => {
      this.wishlistedMap = {};
      products.forEach(p => this.wishlistedMap[p.productId!] = true);
    });
  }


  onWishlistClick(product: ProductDTO) {
    this.wishlistToggled.emit(product);
  }

  onQuickView(product: ProductDTO) {
    this.quickView.emit(product);
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
      case 'grid-2':
        return 'col-6';
      case 'grid-3':
        return 'col-6 col-sm-4';
      case 'grid-4':
        return 'col-6 col-sm-4 col-md-3';
      case 'grid-6':
        return 'col-6 col-sm-4 col-md-3 col-lg-2';
      default:
        return 'col-6';
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
