import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ToastService} from '../../../services/toast';
import {
  AdminCategoriesService,
  AdminProductsService,
  CategoryDTO, CategoryNoProductDTO, NewProductDTO,
  PagedResponseProductDTO,
  ProductDTO
} from '../../openapi';
import {CommonModule} from '@angular/common';


interface ImageFile {
  file: File;
  preview: string;
}

interface FilterParams {
  keyword?: string;
  productName?: string;
  description?: string;
  priceMin?: number;
  priceMax?: number;
  quantityMin?: number;
  quantityMax?: number;
  categoryId?: number;
  categoryName?: string;
}

@Component({
  selector: 'app-product-management',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  // Data properties
  products: ProductDTO[] = [];
  categories: CategoryDTO[] = [];
  pagedResponse: PagedResponseProductDTO = {};

  // State properties
  loading = false;
  categoriesLoading = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // Sorting
  sortField: string = 'productName';
  sortDir: 'asc' | 'desc' = 'asc';
  sortOptions = [
    { value: 'productName', label: 'Product Name' },
    { value: 'price', label: 'Price' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'purchaseCount', label: 'Purchase Count' },
    { value: 'productId', label: 'Product ID' }
  ];

  // Filtering
  filterForm: FormGroup;
  selectedCategoryId: number | null = null;
  keyword = '';

  // View options
  viewMode: 'card' | 'table' = 'table';

  constructor(
    private fb: FormBuilder,
    private productsService: AdminProductsService,
    private categoriesService: AdminCategoriesService
  ) {
    this.filterForm = this.fb.group({
      keyword: [''],
      categoryId: [''],
      priceMin: [''],
      priceMax: [''],
      quantityMin: [''],
      quantityMax: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.setupFilterSubscription();
  }

  setupFilterSubscription(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoriesService.getCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        this.categories = categories;
        this.categoriesLoading = false;
      },
      error: (error : any) => {
        console.error('Error loading categories:', error);
        this.categoriesLoading = false;
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    const filters = this.filterForm.value;

    this.productsService.getProducts(
      this.currentPage,
      this.pageSize,
      this.sortField as any,
      this.sortDir,
      filters.keyword,
      null, // productName
      null, // description
      filters.priceMin,
      filters.priceMax,
      filters.quantityMin,
      filters.quantityMax,
      filters.categoryId || null,
      null // categoryName
    ).subscribe({
      next: (response: PagedResponseProductDTO) => {
        this.pagedResponse = response;
        this.products = response.content || [];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadProducts();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryFilter(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.filterForm.patchValue({ categoryId: categoryId || '' });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.selectedCategoryId = null;
    this.currentPage = 1;
    this.loadProducts();
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productsService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (error: any) => {
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  getCategoryNames(categories: any[]): string {
    return categories?.map(cat => cat.categoryName).join(', ') || 'No categories';
  }

  getPaginationPages(): number[] {
    const totalPages = this.pagedResponse.totalPages || 0;
    const current = this.currentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fas fa-sort';
    return this.sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
  }

  protected readonly Math = Math;
}
