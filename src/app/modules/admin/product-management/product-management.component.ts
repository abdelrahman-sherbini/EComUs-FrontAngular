import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../services/toast';
import {
  AdminCategoriesService,
  AdminProductsService,
  CategoryDTO,
  CategoryNameDTO,
  NewProductDTO,
  PagedResponseProductDTO,
  ProductDTO
} from '../../openapi';
import {CommonModule, DecimalPipe} from '@angular/common';

interface ImageFile {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  imports: [
    CommonModule,
    DecimalPipe,
    ReactiveFormsModule
  ],
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  // Data properties
  products: ProductDTO[] = [];
  categories: CategoryDTO[] = [];
  pagedResponse: PagedResponseProductDTO = {};
  productImages: { [key: number]: string[] } = {};

  // State properties
  loading = false;
  categoriesLoading = false;
  selectedProduct: ProductDTO | null = null;
  selectedProductImages: string[] = [];
  selectedCategories: number[] = [];
  newImages: ImageFile[] = [];

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

  // Update form
  updateProductForm: FormGroup;

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productsService: AdminProductsService,
    private categoriesService: AdminCategoriesService,
    private toastService: ToastService
  ) {
    this.filterForm = this.fb.group({
      keyword: [''],
      categoryId: [''],
      priceMin: ['', [Validators.min(0)]],
      priceMax: ['', [Validators.min(0)]],
      quantityMin: ['', [Validators.min(0)]],
      quantityMax: ['', [Validators.min(0)]]
    });

    this.updateProductForm = this.fb.group({
      productId: [null],
      productName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterSubscription(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoriesService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response;
          this.categoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.categoriesLoading = false;
        }
      });
  }

  loadProducts(): void {
    this.loading = true;
    const filters = this.filterForm.value;

    // Create params object with only non-empty values
    const params: any = {
      pageNum: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDir: this.sortDir
    };

    // Only add filter params if they have values
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.priceMin) params.priceMin = filters.priceMin;
    if (filters.priceMax) params.priceMax = filters.priceMax;
    if (filters.quantityMin) params.quantityMin = filters.quantityMin;
    if (filters.quantityMax) params.quantityMax = filters.quantityMax;
    if (filters.categoryId) params.categoryId = filters.categoryId;

    this.productsService.getProducts(
      params.pageNum,
      params.pageSize,
      params.sortField as any,
      params.sortDir,
      params.keyword || null,
      null, // productName
      null, // description
      params.priceMin || null,
      params.priceMax || null,
      params.quantityMin || null,
      params.quantityMax || null,
      params.categoryId || null,
      null // categoryName
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PagedResponseProductDTO) => {
          this.pagedResponse = response;
          this.products = response.content || [];
          this.loading = false;

          // Load images for card view
          if (this.viewMode === 'card') {
            this.loadAllProductImages();
          }
        },
        error: (error: any) => {
          console.error('Error loading products:', error);
          this.loading = false;
        }
      });
  }
  loadAllProductImages(): void {
    this.products.forEach(product => {
      if (product.productId && !this.productImages[product.productId]) {
        this.loadProductImages(product.productId);
      }
    });
  }

  loadProductImages(productId: number): void {
    // Check if we already have images for this product
    if (this.productImages[productId] && this.productImages[productId].length > 0) {
      // If this is the selected product, update its images
      if (this.selectedProduct?.productId === productId) {
        this.selectedProductImages = this.productImages[productId];
      }
      return;
    }

    // If not, find the product in our products array
    const product = this.products.find(p => p.productId === productId);
    if (product && product.images) {
      this.productImages[productId] = product.images;

      // If this is the selected product, update its images
      if (this.selectedProduct?.productId === productId) {
        this.selectedProductImages = product.images;
      }
      return;
    }

    // If we still don't have images, fetch them from the API as a fallback
    this.productsService.getProductById(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          if (product.images) {
            this.productImages[productId] = product.images;

            // If this is the selected product, update its images
            if (this.selectedProduct?.productId === productId) {
              this.selectedProductImages = product.images;
            }
          }
        },
        error: (error) => {
          console.error(`Error loading product ${productId}:`, error);
          this.productImages[productId] = [];
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
      this.productsService.deleteProduct(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Product deleted successfully');
            this.loadProducts();
          },
          error: (error: any) => {
            this.toastService.showError('Error deleting product');
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

    // Load images if switching to card view
    if (this.viewMode === 'card') {
      this.loadAllProductImages();
    }
  }

  // Open product update modal
  openUpdateModal(product: ProductDTO): void {
    this.selectedProduct = product;

    // Reset form with product data
    this.updateProductForm.patchValue({
      productId: product.productId,
      productName: product.productName,
      description: product.description,
      price: product.price,
      quantity: product.quantity
    });

    // Set selected categories
    this.selectedCategories = product.categories?.map(cat => cat.categoryId || 0).filter(id => id !== 0) || [];

    // Load product images
    if (product.productId) {
      this.loadProductImages(product.productId);
      this.selectedProductImages = this.productImages[product.productId] || [];
    }

    // Reset new images
    this.newImages = [];
  }

  // Open product details modal
  openDetailsModal(product: ProductDTO): void {
    this.selectedProduct = product;

    // Load product images if not already loaded
    if (product.productId) {
      if (this.productImages[product.productId]) {
        this.selectedProductImages = this.productImages[product.productId];
      } else {
        this.loadProductImages(product.productId);
      }
    }
  }

  // Handle file selection for product update
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Process each file
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newImages.push({
            file: file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Remove new image
  removeNewImage(index: number): void {
    if (index >= 0 && index < this.newImages.length) {
      this.newImages.splice(index, 1);
    }
  }

  // Toggle category selection in update form
  toggleCategorySelection(categoryId: number): void {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index === -1) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories.splice(index, 1);
    }
  }

  // Check if category is selected
  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  // Submit product update
  submitUpdateProduct(): void {
    if (this.updateProductForm.invalid) {
      // Mark all fields as touched to trigger validation
      Object.keys(this.updateProductForm.controls).forEach(key => {
        this.updateProductForm.get(key)?.markAsTouched();
      });
      return;
    }

    const productId = this.updateProductForm.get('productId')?.value;
    if (!productId) {
      this.toastService.showError('Product ID is missing');
      return;
    }

    // Prepare product data
    const productData: NewProductDTO = {
      productName: this.updateProductForm.get('productName')?.value,
      description: this.updateProductForm.get('description')?.value,
      price: this.updateProductForm.get('price')?.value,
      quantity: this.updateProductForm.get('quantity')?.value,
      categories: this.selectedCategories.map(categoryId => {
        const category = this.categories.find(cat => cat.categoryId === categoryId);
        return { categoryName: category?.categoryName || '' };
      })
    };

    // Update product
    this.productsService.updateProduct(productId, productData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProduct) => {
          // Upload new images if any
          if (this.newImages.length > 0) {
            this.uploadProductImages(productId);
          } else {
            this.handleUpdateSuccess(updatedProduct);
          }
        },
        error: (error) => {
          this.toastService.showError('Failed to update product');
          console.error('Error updating product:', error);
        }
      });
  }

  // Upload product images
  uploadProductImages(productId: number): void {
    const files = this.newImages.map(img => img.file);

    this.productsService.uploadProductImages(productId.toString(), files)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Product images uploaded successfully');

          // Refresh product in the list
          const index = this.products.findIndex(p => p.productId === productId);
          if (index !== -1) {
            this.productsService.getProductById(productId)
              .pipe(takeUntil(this.destroy$))
              .subscribe(product => {
                this.products[index] = product;
                this.handleUpdateSuccess(product);
              });
          } else {
            this.loadProducts();
          }
        },
        error: (error) => {
          this.toastService.showError('Failed to upload product images');
          console.error('Error uploading images:', error);
        }
      });
  }

  // Delete an existing product image
  deleteProductImage(index: number): void {
    if (!this.selectedProduct?.productId) {
      return;
    }

    const productId = this.selectedProduct.productId;
    const imagePath = this.selectedProductImages[index];

    // Extract the image name from the path
    const imageName = imagePath.split('/').pop();

    if (!imageName) {
      this.toastService.showError('Could not determine image name');
      return;
    }

    // Confirm deletion
    if (confirm('Are you sure you want to delete this image?')) {
      this.productsService.deleteProductImage(productId, imageName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local arrays
            this.selectedProductImages.splice(index, 1);

            if (this.productImages[productId]) {
              const imageIndex = this.productImages[productId].findIndex(img => img === imagePath);
              if (imageIndex !== -1) {
                this.productImages[productId].splice(imageIndex, 1);
              }
            }

            this.toastService.showSuccess('Image deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting image:', error);
            this.toastService.showError('Failed to delete image');
          }
        });
    }
  }
  // Handle successful update
  private handleUpdateSuccess(product: ProductDTO): void {
    this.toastService.showSuccess('Product updated successfully');

    // Update product in list
    const index = this.products.findIndex(p => p.productId === product.productId);
    if (index !== -1) {
      this.products[index] = product;
    }

    // Update product images in cache
    if (product.productId) {
      delete this.productImages[product.productId];
      this.loadProductImages(product.productId);
    }

    // Reset form and state
    this.newImages = [];
    this.selectedCategories = [];
    this.selectedProduct = null;

    const modalElement = document.getElementById('updateProductModal');
    if (modalElement) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  protected readonly Math = Math;
}
