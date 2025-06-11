import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerCartService, CartDTO, PagedResponseCartDTO, ShoppingCartDTO } from '../../openapi';
import { AsyncPipe, CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import {ShoppingService} from '../../../services/shopping.service';

@Component({
  selector: 'app-cart',
  imports: [ CurrencyPipe,
    CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cartItems: CartDTO[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;
  loading: boolean = false;
  error: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;
  totalElements: number = 0;
  totalPages: number = 0;
  sortField: 'quantity' | 'productId' | 'userId' = 'productId';
  sortDir: 'asc' | 'desc' = 'asc';

  // Confirmation dialog properties
  showConfirmation: boolean = false;

  // Make Math available in template
  Math = Math;

  constructor(
    private shoppingService: ShoppingService,
    private cartService: CustomerCartService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Read URL parameters first, then load data
    this.initializeFromUrlParams();
    this.loadCartItems();
    this.loadTotalPrice();
    this.loadTotalQuantity();
  }

  /**
   * Initialize component state from URL parameters
   */
  private initializeFromUrlParams(): void {
    this.route.queryParams.subscribe(params => {
      // Read pageNum (note: your URL uses pageNum, but component uses currentPage)
      if (params['pageNum']) {
        this.currentPage = +params['pageNum'];
      }

      // Read pageSize
      if (params['pageSize']) {
        this.pageSize = +params['pageSize'];
      }

      // Read sortField
      if (params['sortField'] && ['quantity', 'productId', 'userId'].includes(params['sortField'])) {
        this.sortField = params['sortField'] as 'quantity' | 'productId' | 'userId';
      }

      // Read sortDir
      if (params['sortDir'] && ['asc', 'desc'].includes(params['sortDir'])) {
        this.sortDir = params['sortDir'] as 'asc' | 'desc';
      }
    });
  }

  /**
   * Update URL parameters when pagination/sorting changes
   */
  private updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        pageNum: this.currentPage,
        pageSize: this.pageSize,
        sortField: this.sortField,
        sortDir: this.sortDir
      },
      queryParamsHandling: 'merge'
    });
  }

  loadCartItems(): void {
    this.loading = true;
    this.error = '';

    this.cartService.getCartItems(
      this.currentPage,
      this.pageSize,
      this.sortField as 'quantity' | 'productId' | 'userId',
      this.sortDir as 'asc' | 'desc'
    ).subscribe({
      next: (response: PagedResponseCartDTO) => {
        this.cartItems = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.currentPage || 1;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load cart items';
        this.loading = false;
        console.error('Error loading cart items:', error);
      }
    });
  }

  loadTotalPrice(): void {
    this.cartService.getTotalPrice().subscribe({
      next: (total: number) => {
        this.totalPrice = total;
      },
      error: (error) => {
        console.error('Error loading total price:', error);
      }
    });
  }

  loadTotalQuantity(): void {
    this.cartService.getTotalQuantity().subscribe({
      next: (total: number) => {
        this.totalQuantity = total;
      },
      error: (error) => {
        console.error('Error loading total quantity:', error);
      }
    });
  }

  // Clear Cart Methods
  showClearCartConfirmation(): void {
    this.showConfirmation = true;
  }

  cancelClearCart(): void {
    this.showConfirmation = false;
  }

  confirmClearCart(): void {
    this.showConfirmation = false;
    this.clearAllCart();
  }

  clearAllCart(): void {
    this.loading = true;
    this.error = '';
    
    const productIds = this.cartItems.map(item => item.product?.productId).filter(id => id !== undefined) as number[];
    
    if (productIds.length === 0) {
      this.loading = false;
      return;
    }
    
    // Remove all items sequentially
    const removePromises = productIds.map(productId => 
      this.cartService.removeCartItem(productId).toPromise()
    );
    
    Promise.all(removePromises).then(() => {
      this.cartItems = [];
      this.totalPrice = 0;
      this.totalQuantity = 0;
      this.totalElements = 0;
      this.totalPages = 0;
      this.currentPage = 1;
      this.loading = false;
      
      this.updateUrlParams();
      this.shoppingService.refreshCounts();
      
      console.log('All cart items cleared successfully');
    }).catch((error) => {
      this.error = 'Failed to clear some cart items';
      this.loading = false;
      console.error('Error clearing cart items:', error);
      
      // Reload cart to get current state
      this.loadCartItems();
      this.loadTotalPrice();
      this.loadTotalQuantity();
    });
  }

  // Pagination methods - Updated to sync with URL
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updateUrlParams();
      this.loadCartItems();
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  // Updated to sync with URL
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.changePageSize(+target.value);
  }

  changePageSize(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadCartItems();
  }

  // Updated to sync with URL
  onSortFieldChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.changeSorting(target.value as 'quantity' | 'productId' | 'userId', this.sortDir);
  }

  // Updated to sync with URL
  onSortDirChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.changeSorting(this.sortField, target.value as 'asc' | 'desc');
  }

  changeSorting(field: 'quantity' | 'productId' | 'userId', direction: 'asc' | 'desc'): void {
    this.sortField = field;
    this.sortDir = direction;
    this.currentPage = 1;
    this.updateUrlParams();
    this.loadCartItems();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const shoppingCartDTO: ShoppingCartDTO = {
      productId: productId,
      quantity: newQuantity
    };

    this.cartService.removeOrUpdateCartItem(shoppingCartDTO).subscribe({
      next: (updatedItem: CartDTO) => {
        const index = this.cartItems.findIndex(item => item.product?.productId === productId);
        if (index !== -1) {
          this.cartItems[index] = updatedItem;
        }
        this.loadTotalPrice();
        this.loadTotalQuantity();
        this.shoppingService.decrementCartCount(shoppingCartDTO.quantity);
      },
      error: (error) => {
        this.error = 'Failed to update cart item';
        console.error('Error updating cart item:', error);
      }
    });
  }

  removeItem(productId: number): void {
    this.cartService.removeCartItem(productId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(item => item.product?.productId !== productId);

        if (this.cartItems.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          this.updateUrlParams();
        }

        this.loadCartItems();
        this.loadTotalPrice();
        this.loadTotalQuantity();
        this.shoppingService.refreshCounts();
      },
      error: (error) => {
        this.error = 'Failed to remove cart item';
        console.error('Error removing cart item:', error);
      }
    });
  }

  // FIXED: Updated methods to work correctly with backend
  increaseQuantity(productId: number, currentQuantity: number): void {
    // Use addOrUpdateCartItem to ADD 1 to the existing quantity
    const shoppingCartDTO: ShoppingCartDTO = {
      productId: productId,
      quantity: 1  // Add 1 to existing quantity
    };
    const cartItem = this.cartItems.find(item => item.product?.productId === productId);
    if (cartItem!.quantity! >= cartItem!.product.quantity!) {
      this.error = 'Not enough stock available';
      return;
    }

    this.cartService.addOrUpdateCartItem(shoppingCartDTO).subscribe({
      next: (updatedItem: CartDTO) => {
        const index = this.cartItems.findIndex(item => item.product?.productId === productId);
        if (index !== -1) {
          this.cartItems[index] = updatedItem;
        }
        this.loadTotalPrice();
        this.loadTotalQuantity();
        this.shoppingService.incrementCartCount();
      },
      error: (error) => {
        this.error = 'Failed to update cart item';
        console.error('Error updating cart item:', error);
      }
    });
  }

  decreaseQuantity(productId: number, currentQuantity: number): void {
    if (currentQuantity <= 1) {
      this.removeItem(productId);
      return;
    }


    const shoppingCartDTO: ShoppingCartDTO = {
      productId: productId,
      quantity: 1  // Subtract 1 from existing quantity
    };

    this.cartService.removeOrUpdateCartItem(shoppingCartDTO).subscribe({
      next: (updatedItem: CartDTO) => {
        const index = this.cartItems.findIndex(item => item.product?.productId === productId);
        if (index !== -1) {
          this.cartItems[index] = updatedItem;
        }
        this.loadTotalPrice();
        this.loadTotalQuantity();
        this.shoppingService.decrementCartCount();
      },
      error: (error) => {
        this.error = 'Failed to update cart item';
        console.error('Error updating cart item:', error);
      }
    });
  }

  getItemTotal(item: CartDTO): number {
    return (item.product?.price || 0) * (item.quantity || 0);
  }

  checkoutAttempted: boolean = false;

  proceedToCheckout(): void {
    this.checkoutAttempted = true;


    const termsCheckbox = document.getElementById('terms') as HTMLInputElement;

    if (!termsCheckbox?.checked) {
   
      return;
    }

   
    this.checkoutAttempted = false;
    console.log('Proceeding to checkout...');
    this.router.navigate(['/user/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  jumpToPage(event: Event): void {
    const target = event.target as HTMLInputElement;
    const page = +target.value;
    if (page >= 1 && page <= this.totalPages) {
      this.goToPage(page);
    }
  }

  trackByProductId(index: number, item: CartDTO): number {
    return item.product?.productId || index;
  }
}