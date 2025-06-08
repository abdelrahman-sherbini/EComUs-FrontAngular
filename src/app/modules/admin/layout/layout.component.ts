import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule, RouterOutlet} from '@angular/router';
import {AuthService} from '../../../services/auth-service';
import {Observable, Subject, takeUntil} from 'rxjs';
import {ToastComponent} from "../../../components/toast/toast.component";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminCategoriesService, AdminProductsService, CategoryDTO, NewProductDTO} from '../../openapi';
import {ToastService} from '../../../services/toast';


interface ImagePreview {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, ToastComponent, ReactiveFormsModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit , OnDestroy {

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  currentUser$: Observable<any>;
  categoryForm: FormGroup;
  constructor(private categoriesService: AdminCategoriesService, private adminCategoriesService: AdminCategoriesService, private toastService: ToastService,private adminProductsService: AdminProductsService,private authService: AuthService,private router: Router,private formBuilder: FormBuilder,) {
    this.categoryForm = this.formBuilder.group({
      categoryName: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.productForm = this.formBuilder.group({
      productName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
    this.currentUser$ = this.authService.currentUser$;
  }
  title = 'ecomus-admin';

  sidebarCollapsed = true; // Always start collapsed for hover behavior
  isMobile = false;
  sidebarHovered = false;

  ngOnInit() {
    this.checkScreenSize();
    this.loadCategories();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar() {
    // Only toggle for mobile
    if (this.isMobile) {
      this.sidebarCollapsed = !this.sidebarCollapsed;

      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        if (!this.sidebarCollapsed) {
          sidebar.classList.add('show');
        } else {
          sidebar.classList.remove('show');
        }
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.navbar .btn');

    // Only handle clicks for mobile
    if (this.isMobile &&
      sidebar &&
      !sidebar.contains(target) &&
      toggleButton &&
      !toggleButton.contains(target) &&
      !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      sidebar.classList.remove('show');
    }
  }

  // Optional: Track hover state for additional functionality
  onSidebarMouseEnter() {
    if (!this.isMobile) {
      this.sidebarHovered = true;
    }
  }

  onSidebarMouseLeave() {
    if (!this.isMobile) {
      this.sidebarHovered = false;
    }
  }

  // Product form
  productForm: FormGroup;
  availableCategories: CategoryDTO[] = [];
  selectedCategories: number[] = [];
  selectedImages: ImagePreview[] = [];
  categoriesLoading = false;
  isSubmittingProduct = false;

  openAddProductModal(): void {
    // Reset form and modal state
    this.productForm.reset();
    this.selectedCategories = [];
    this.selectedImages = [];

    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addProductModal'));
    modal.show();
  }

  // Product form handlers
  onImageSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 5 images
      const maxImages = 5;
      const selectedFiles = Array.from(files).slice(0, maxImages - this.selectedImages.length);

      selectedFiles.forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImages.push({
            file: file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  onCategoryChange(category: CategoryDTO, event: any): void {
    if (event.target.checked) {
      this.selectedCategories.push(category.categoryId);
    } else {
      const index = this.selectedCategories.indexOf(category.categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      }
    }
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  onSubmitProduct(): void {
    if (this.productForm.valid) {
      this.isSubmittingProduct = true;

      // Prepare form data
      const formData = new FormData();

      // Prepare product data
      const productData: NewProductDTO = {
        productName: this.productForm.get('productName')?.value,
        description: this.productForm.get('description')?.value,
        price: this.productForm.get('price')?.value,
        quantity: this.productForm.get('quantity')?.value,
        categories: this.selectedCategories.map(categoryId => {
          const category = this.availableCategories.find(cat => cat.categoryId === categoryId);
          return { categoryName: category?.categoryName || '' };
        })
      };

      // Add product as JSON string
      formData.append('product', JSON.stringify(productData));

      // Add images
      this.selectedImages.forEach(imagePreview => {
        formData.append('images', imagePreview.file);
      });

      // Submit to API
      this.adminProductsService.addProduct(JSON.stringify(productData), this.selectedImages.map(img => img.file))
        .subscribe({
          next: (result) => {
            this.toastService.showSuccess('Product added successfully: '+ result.productName);
            this.isSubmittingProduct = false;

            // Close modal
            const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal?.hide();

            // Reset form
            this.productForm.reset();
            this.selectedCategories = [];
            this.selectedImages = [];

          },
          error: (error) => {
            this.toastService.showError('Error adding product:', error);
            this.isSubmittingProduct = false;
            // Handle error - could show toast notification
          }
        });
    }
  }
  loadCategories(): void {
    this.categoriesLoading = true;
    this.adminCategoriesService.getCategories().subscribe({
      next: (categories) => {
        this.availableCategories = categories;
        this.categoriesLoading = false;
      },
      error: (error) => {
        this.toastService.showError('Error loading categories:', error);
        this.categoriesLoading = false;
      }
    });
  }
  openAddModal(): void {
    this.categoryForm.reset();

    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addCategoryModal'));
    modal.show();
  }

  // Add new category
  addCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryData: CategoryDTO = {
      categoryId: 0, // Will be assigned by the server
      categoryName: this.categoryForm.get('categoryName')?.value,
      products: [] // Empty products array
    };

    this.categoriesService.createCategory(categoryData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Category added successfully');
          this.loadCategories();

          // Close modal
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
          if (modal) {
            modal.hide();
          }

          // Reset form
          this.categoryForm.reset();
        },
        error: (error) => {
          console.error('Error adding category:', error);
          this.toastService.showError('Failed to add category');
        }
      });
  }

}
