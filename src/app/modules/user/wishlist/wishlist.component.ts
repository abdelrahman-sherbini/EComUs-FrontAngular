import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerWishlistService } from '../../openapi';
import { PagedResponseProductDTO, ProductDTO } from '../../openapi';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import {ShoppingService} from '../../../services/shopping.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  imports: [
    CommonModule,
    FormsModule,
    SlicePipe,
    CurrencyPipe
  ],
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlistItems: ProductDTO[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 0; // Internal 0-based page tracking
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // Filters
  searchKeyword = '';
  selectedCategory = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortField: 'productId' | 'userId' = 'productId';
  sortDir: 'asc' | 'desc' = 'asc';

  constructor(private shoppingService: ShoppingService,private wishlistService: CustomerWishlistService) {}

  ngOnInit(): void {
    this.loadWishlistItems();
  }

  // Load wishlist items without any filters (for initial load and pagination)
  loadWishlistItems(): void {
    this.loading = true;
    this.error = null;

    // Convert 0-based currentPage to 1-based pageNum for API
    const apiPageNum = this.currentPage + 1;

    console.log('Loading wishlist items with basic params:', {
      pageNum: apiPageNum,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDir: this.sortDir
    });

    // Call API with only basic pagination and sorting parameters
    // Convert 0-based currentPage to 1-based pageNum
    this.wishlistService.getWishItems(
      apiPageNum, // This maps to pageNum (1-based)
      this.pageSize,
      this.sortField,
      this.sortDir
    ).subscribe({
      next: (response: PagedResponseProductDTO) => {
        console.log('Wishlist API response:', response);
        this.wishlistItems = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        this.loading = false;

        if (this.wishlistItems.length === 0) {
          console.log('No items found in wishlist response');
        }
      },
      error: (err: any) => {
        console.error('Wishlist API error:', err);
        this.error = `Failed to load wishlist items: ${err.message || 'Unknown error'}`;
        this.loading = false;

        // Additional error details for debugging
        if (err.status === 500) {
          console.error('Server error details:', err.error);
          this.error = 'Server error occurred. Please try again later.';
        }
      }
    });
  }

  // Load wishlist items with filters (for search and filtering)
  loadWishlistItemsWithFilters(): void {
    this.loading = true;
    this.error = null;

    // Convert 0-based currentPage to 1-based pageNum for API
    const apiPageNum = this.currentPage + 1;

    console.log('Loading wishlist items with filters:', {
      pageNum: apiPageNum,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDir: this.sortDir,
      searchKeyword: this.searchKeyword,
      selectedCategory: this.selectedCategory,
      priceMin: this.priceMin,
      priceMax: this.priceMax
    });

    // Full API call with all parameters
    this.wishlistService.getWishItems(
      apiPageNum, // Convert to 1-based
      this.pageSize,
      this.sortField,
      this.sortDir,
      this.searchKeyword || undefined,
      undefined, // productName
      undefined, // description
      this.priceMin || undefined,
      this.priceMax || undefined,
      undefined, // categoryId
      this.selectedCategory || undefined
    ).subscribe({
      next: (response: PagedResponseProductDTO) => {
        this.wishlistItems = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = `Failed to load wishlist items: ${err.message || 'Unknown error'}`;
        this.loading = false;
        console.error('Error loading wishlist with filters:', err);
      }
    });
  }

  removeFromWishlist(productId: number): void {
    console.log('Removing product from wishlist:', productId);

    this.wishlistService._delete(productId).subscribe({
      next: () => {
        console.log('Product removed successfully');
        // Reload with current view (filtered or unfiltered)

        this.shoppingService.decrementWishlistCount()
        if (this.hasActiveFilters()) {
          this.loadWishlistItemsWithFilters();
        } else {
          this.loadWishlistItems();
        }
      },
      error: (err: any) => {
        console.error('Error removing item:', err);
        this.error = `Failed to remove item: ${err.message || 'Unknown error'}`;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadWishlistItemsWithFilters(); // Use filtered version for search
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Use appropriate loading method based on whether filters are active
    if (this.hasActiveFilters()) {
      this.loadWishlistItemsWithFilters();
    } else {
      this.loadWishlistItems();
    }
  }

  onSortChange(): void {
    this.currentPage = 0;
    // Use appropriate loading method based on whether filters are active
    if (this.hasActiveFilters()) {
      this.loadWishlistItemsWithFilters();
    } else {
      this.loadWishlistItems();
    }
  }

  clearFilters(): void {
    this.searchKeyword = '';
    this.selectedCategory = '';
    this.priceMin = null;
    this.priceMax = null;
    this.currentPage = 0;
    this.loadWishlistItems(); // Load without filters
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

  protected readonly Math = Math;
}
