import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast';
import {
  AdminCategoriesService,
  CategoryDTO
} from '../../openapi';

@Component({
  selector: 'app-category-management',
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  standalone: true
})
export class CategoryManagementComponent implements OnInit, OnDestroy {
  // Data properties
  categories: CategoryDTO[] = [];

  // State properties
  loading = false;
  selectedCategory: CategoryDTO | null = null;

  // Forms
  categoryForm: FormGroup;
  updateCategoryForm: FormGroup;

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private categoriesService: AdminCategoriesService,
    private formBuilder: FormBuilder,
    private toastService: ToastService
  ) {
    // Initialize forms
    this.categoryForm = this.formBuilder.group({
      categoryName: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.updateCategoryForm = this.formBuilder.group({
      categoryId: [null],
      categoryName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoriesService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.toastService.showError('Failed to load categories');
          this.loading = false;
        }
      });
  }

  // Open add category modal
  openAddModal(): void {
    this.categoryForm.reset();

    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addCategoryModal'));
    modal.show();
  }

  // Open update category modal
  openUpdateModal(category: CategoryDTO): void {
    this.selectedCategory = category;

    this.updateCategoryForm.patchValue({
      categoryId: category.categoryId,
      categoryName: category.categoryName
    });

    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('updateCategoryModal'));
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

  // Update category
  updateCategory(): void {
    if (this.updateCategoryForm.invalid) {
      this.updateCategoryForm.markAllAsTouched();
      return;
    }

    const categoryData: CategoryDTO = {
      categoryId: this.updateCategoryForm.get('categoryId')?.value,
      categoryName: this.updateCategoryForm.get('categoryName')?.value,
      products: this.selectedCategory?.products || [] // Keep existing products
    };

    this.categoriesService.updateCategory(categoryData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Category updated successfully');
          this.loadCategories();

          // Close modal
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('updateCategoryModal'));
          if (modal) {
            modal.hide();
          }
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.toastService.showError('Failed to update category');
        }
      });
  }

  // Delete category
  deleteCategory(categoryId: number): void {
    if (confirm('Are you sure you want to delete this category? This may affect products associated with it.')) {
      this.categoriesService.deleteCategory(categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Category deleted successfully');
            this.loadCategories();
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.toastService.showError('Failed to delete category');
          }
        });
    }
  }

  // Get random color for category card
  getCategoryColor(index: number): string {
    const colors = [
      'primary', 'success', 'info', 'warning', 'danger',
      'purple', 'pink', 'indigo', 'teal', 'orange'
    ];
    return colors[index % colors.length];
  }
}
