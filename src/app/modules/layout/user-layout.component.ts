import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, Subject, switchMap, tap } from 'rxjs';
import {CustomerProductsService, ProductDTO} from '../openapi';
import {AuthService} from '../../services/auth-service';
import {ShoppingService} from '../../services/shopping.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, FormsModule],
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss']
})
export class UserLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  searchKeyword: string = '';
  searchResults: ProductDTO[] = [];
  showSearchResults: boolean = false;
  isSearching: boolean = false;
  currentPage: number = 0;
  pageSize: number = 5;
  totalPages: number = 0;
  hasMoreResults: boolean = false;
  showUserDropdown: boolean = false;

  private searchSubject = new Subject<string>();

  cartCount$: Observable<number>;
  wishlistCount$: Observable<number>;
  currentUser$: Observable<any>;

  @ViewChild('loadMoreTrigger') loadMoreTrigger: ElementRef | undefined;
  private observer: IntersectionObserver | undefined;

  constructor(
    private router: Router,
    protected authService: AuthService,
    private shoppingService: ShoppingService,
    private productService: CustomerProductsService
  ) {
    this.cartCount$ = this.shoppingService.cartItemsCount$;
    this.wishlistCount$ = this.shoppingService.wishlistItemsCount$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.isSearching = true;
        this.currentPage = 0;
        this.searchResults = [];
      }),
      switchMap(keyword =>
        this.productService.getProducts1(
          this.currentPage + 1, // API is 1-indexed
          this.pageSize,
          undefined,
          undefined,
          keyword
        )
      )
    ).subscribe(response => {
      this.searchResults = response.content || [];
      this.totalPages = response.totalPages || 0;
      this.hasMoreResults = (this.currentPage + 1) < this.totalPages;
      this.isSearching = false;
      this.showSearchResults = true;

      // Setup observer after results are loaded
      setTimeout(() => this.observeLoadMoreTrigger(), 100);
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    // Create observer with options
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // If the element is in view and we have more results to load
        if (entry.isIntersecting && this.hasMoreResults && !this.isSearching) {
          this.loadMoreResults();
        }
      });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is visible
  }

  private observeLoadMoreTrigger(): void {
    // Need to check if the element exists since search results might not be visible yet
    if (this.loadMoreTrigger && this.observer) {
      this.observer.observe(this.loadMoreTrigger.nativeElement);
    }
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      this.searchSubject.next(this.searchKeyword);
    } else {
      this.clearSearch();
    }
  }

  loadMoreResults(): void {
    if (this.hasMoreResults && !this.isSearching) {
      this.isSearching = true;
      this.currentPage++;

      this.productService.getProducts1(
        this.currentPage + 1, // API is 1-indexed
        this.pageSize,
        undefined,
        undefined,
        this.searchKeyword
      ).subscribe(response => {
        if (response.content) {
          this.searchResults = [...this.searchResults, ...response.content];
        }
        this.hasMoreResults = (this.currentPage + 1) < (response.totalPages || 0);
        this.isSearching = false;

        // Re-observe after loading more results
        setTimeout(() => this.observeLoadMoreTrigger(), 100);
      });
    }
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.currentPage = 0;
  }

  navigateToProduct(productId: number): void {
    this.clearSearch();
    this.router.navigate(['/product', productId]);
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  navigateToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation(); // Prevent document click from immediately closing it
    this.showUserDropdown = !this.showUserDropdown;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      // Navigation is handled in the auth service
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Handle search container clicks
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showSearchResults = false;
    }

    // Handle user dropdown clicks
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown && !userDropdown.contains(event.target as Node)) {
      this.showUserDropdown = false;
    }
  }
}
