import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDTO } from '../../openapi';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { WishListService } from '../../../services/wish-list-service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  imports: [
    CommonModule,
    FormsModule,
    SlicePipe,
    CurrencyPipe
  ],
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit, OnDestroy {
  @Input() hideHeader: boolean = false;

  // All wishlist items from service
  allWishlistItems: ProductDTO[] = [];
  // Filtered and paginated items to display
  wishlistItems: ProductDTO[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // Filters
  searchKeyword = '';
  selectedCategory = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortField: 'productId' | 'productName' | 'price' = 'productId';
  sortDir: 'asc' | 'desc' = 'asc';

  private wishlistSubscription?: Subscription;

  constructor(
    private wishListService: WishListService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToWishlist();
    this.refreshWishlist();
  }

  ngOnDestroy(): void {
    if (this.wishlistSubscription) {
      this.wishlistSubscription.unsubscribe();
    }
  }

  private subscribeToWishlist(): void {
    this.wishlistSubscription = this.wishListService.getAllWishlistedProducts$().subscribe({
      next: (products) => {
        this.allWishlistItems = products;
        this.applyFiltersAndPagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading wishlist:', err);
        this.error = 'Failed to load wishlist items';
        this.loading = false;
      }
    });
  }

  private refreshWishlist(): void {
    this.loading = true;
    this.error = null;
    this.wishListService.refreshWishlist();
  }

  private applyFiltersAndPagination(): void {
    let filteredItems = [...this.allWishlistItems];

    // Apply search filter
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.productName?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filteredItems = filteredItems.filter(item =>
        item.categories?.some(cat =>
          cat.categoryName?.toLowerCase() === this.selectedCategory.toLowerCase()
        )
      );
    }

    // Apply price filters
    if (this.priceMin !== null) {
      filteredItems = filteredItems.filter(item =>
        item.price !== undefined && item.price >= this.priceMin!
      );
    }
    if (this.priceMax !== null) {
      filteredItems = filteredItems.filter(item =>
        item.price !== undefined && item.price <= this.priceMax!
      );
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case 'productId':
          aValue = a.productId || 0;
          bValue = b.productId || 0;
          break;
        case 'productName':
          aValue = a.productName || '';
          bValue = b.productName || '';
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        default:
          aValue = a.productId || 0;
          bValue = b.productId || 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Update totals
    this.totalElements = filteredItems.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);

    // Ensure current page is valid
    if (this.currentPage >= this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages - 1;
    }

    // Apply pagination
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.wishlistItems = filteredItems.slice(startIndex, endIndex);
  }

  removeFromWishlist(productId: number): void {
    if (!productId) return;

    console.log('Removing product from wishlist:', productId);
    this.wishListService.remove(productId).subscribe({
      next: () => {
        console.log('Product removed successfully');
        // The wishlist will automatically update through the subscription
      },
      error: (err) => {
        console.error('Error removing item:', err);
        // Error handling is already done in the service
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.applyFiltersAndPagination();
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
    }
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.applyFiltersAndPagination();
  }

  clearFilters(): void {
    this.searchKeyword = '';
    this.selectedCategory = '';
    this.priceMin = null;
    this.priceMax = null;
    this.currentPage = 0;
    this.applyFiltersAndPagination();
  }

  // Helper method to check if any filters are active
  private hasActiveFilters(): boolean {
    return !!(this.searchKeyword ||
      this.selectedCategory ||
      this.priceMin !== null ||
      this.priceMax !== null);
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 0; i < this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  // Force refresh method (can be called from template if needed)
  forceRefresh(): void {
    this.refreshWishlist();
  }

  protected readonly Math = Math;

  navigateToProductDetails(productId: number): void {
    if (productId) {
      this.router.navigate(['/products/product', productId]);
    }
  }

  trackByProductId(index: number, product: ProductDTO): number | undefined {
    return product.productId;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/assets/placeholder.jpg';
  }
}

