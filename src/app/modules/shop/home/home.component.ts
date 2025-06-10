import {Component, OnInit, ViewChild} from '@angular/core';
import {ProductFilterComponent} from '../product-filter/product-filter.component';
import {ProductGridComponent} from '../product-grid/product-grid.component';
import {QuickAddModalComponent} from '../quick-add-modal/quick-add-modal.component';
import {QuickViewModalComponent} from '../quick-view-modal/quick-view-modal.component';
import {
  CategoryDTO,
  CustomerCategoriesService,
  CustomerProductsService,
  PagedResponseProductDTO,
  ProductDTO
} from '../../openapi';
import {NgForOf, NgIf} from '@angular/common';
import {ToastComponent} from '../../../components/toast/toast.component';
import {PopupComponent} from "../../../components/popup/popup.component";
import {WishListService} from '../wish-list-service';


@Component({
  selector: 'app-home',
  imports: [
    ProductFilterComponent,
    ProductGridComponent,
    QuickAddModalComponent,
    QuickViewModalComponent,
    NgIf,
    NgForOf,
    ToastComponent,
    PopupComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit  {
  products: ProductDTO[] = [];
  originalProducts: ProductDTO[] = [];
  categories: CategoryDTO[] = [];
  // Paging & Sorting
  currentPage: any =1 ; // Start at page 0
  pageSize:number = 10;   // Default page size, change as needed
  totalPages:any  =0;
  totalElements:number | undefined;
  sortValue = 'Featured';
  sortField:any = 'productId';
  sortDir:any = 'asc';

  gridClass: string = 'grid-4';
  private priceMin: undefined;
  private priceMax: undefined;
  private categoryName:string|undefined;
  private quantityMin: number | undefined;
  private quantityMax: number | undefined;
  wishlistProducts: ProductDTO[] = [];


  @ViewChild(QuickAddModalComponent) quickAddModal!: QuickAddModalComponent;
  @ViewChild(QuickViewModalComponent) quickViewModal!: QuickViewModalComponent;
  @ViewChild(ProductGridComponent) productGrid!: ProductGridComponent;


  constructor(
    private productsApi: CustomerProductsService,
    private categoriesApi:CustomerCategoriesService,
    private wishListService: WishListService
  ) {}

  ngOnInit(): void {
    this.categoriesApi.getCategories1().subscribe((cat: CategoryDTO[]) => {
      this.categories = cat || [];
    });
    this.wishListService.wishlistProducts$.subscribe(products => {
      this.wishlistProducts = products;
    });
    this.loadProducts();

  }

  loadProducts(): void {
    this.productsApi.getProducts1(
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortDir,
      undefined, // keyword
      undefined, // productName
      undefined, // description
      this.priceMin,
      this.priceMax,
      this.quantityMin, // quantityMin
      this.quantityMax, // quantityMax
      undefined, // categoryId
      this.categoryName // categoryName
    ).subscribe((res: PagedResponseProductDTO) => {
      this.products = res.content || [];
      this.originalProducts = res.content || [];
      this.totalPages = res.totalPages;
      this.totalElements = res.totalElements;
    });
  }

  openQuickAdd(product: any) {
    this.quickAddModal.open(product);
  }

  openQuickView(product: any) {
    if ( !product.images) product.images = [];
    this.quickViewModal.open(product);
  }

  openFilterSidebar() {
    this.productGrid.openSidebar();
  }

  onGridChange(columns: number) {
    this.gridClass = `grid-${columns}`;
  }

  handleSortChange(sort: string) {
    this.sortValue = sort;
    // Map UI value to field/dir:
    switch (sort) {
      case 'Name: a → z':
        this.sortField = 'productName';
        this.sortDir = 'asc';
        break;
      case 'Name: z → a':
        this.sortField = 'productName';
        this.sortDir = 'desc';
        break;
      case 'Price: Low to High':
        this.sortField = 'price';
        this.sortDir = 'asc';
        break;
      case 'Price: High to Low':
        this.sortField = 'price';
        this.sortDir = 'desc';
        break;
      default:
        this.sortField = 'productId';
        this.sortDir = 'asc';
        break;
    }
    this.currentPage = 1; // Reset to first page when sorting
    this.loadProducts();
  }

  goToPage(page: any) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadProducts();

  }

  visiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const max = this.totalPages;
    const cur = this.currentPage;

    if (max <= 5) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else {
      if (cur <= 3) {
        pages.push(1, 2, 3, 4, '...', max);
      } else if (cur >= max - 2) {
        pages.push(1, '...', max - 3, max - 2, max - 1, max);
      } else {
        pages.push(1, '...', cur - 1, cur, cur + 1, '...', max);
      }
    }
    return pages;
  }

  onFilterApplied(filter: any) {
    this.currentPage = 1;
    this.pageSize= 10;
    this.priceMin= filter.minPrice || undefined;
    this.priceMax= filter.maxPrice || undefined;
    this.categoryName= filter.categories.join(',') || undefined;
    this.quantityMin = filter.stockStatus === 'inStock' ? 1 :undefined;
    this.quantityMax = filter.stockStatus === 'outOfStock'? 0:undefined;
    this.loadProducts();
    console.log("min" + this.quantityMin);
    console.log("max" + this.quantityMax);
  }

  isWishlisted(product: ProductDTO): boolean {
    return this.wishlistProducts.some(p => p.productId === product.productId);
  }

  onWishlistToggled(product: ProductDTO) {
    if (this.isWishlisted(product)) {
      this.wishListService.remove(product.productId!).subscribe();
    } else {
      this.wishListService.add(product.productId!).subscribe();
    }
  }

}
