import {Component, OnInit, ViewChild} from '@angular/core';
import {FooterComponent} from '../footer/footer.component';
import {ProductService} from '../product';
import {HeaderComponent} from '../header/header.component';
import {ProductFilterComponent} from '../product-filter/product-filter.component';
import {ProductGridComponent} from '../product-grid/product-grid.component';
import {QuickAddModalComponent} from '../quick-add-modal/quick-add-modal.component';
import {QuickViewModalComponent} from '../quick-view-modal/quick-view-modal.component';


@Component({
  selector: 'app-home',
  imports: [
    FooterComponent,
    HeaderComponent,
    ProductFilterComponent,
    ProductGridComponent,
    QuickAddModalComponent,
    QuickViewModalComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit  {
  products: any[] = [];
  originalProducts: any[] = [];
  categories: any[] = [];
  cartSize: number = 0;
  isLoggedIn: boolean = false;
  sortValue = 'Featured';


  @ViewChild(QuickAddModalComponent) quickAddModal!: QuickAddModalComponent;
  @ViewChild(QuickViewModalComponent) quickViewModal!: QuickViewModalComponent;
  @ViewChild(ProductGridComponent) productGrid!: ProductGridComponent;


  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.categories = this.productService.getCategories();
    this.cartSize = this.productService.getCartSize();
    this.isLoggedIn = this.productService.isLoggedIn();
    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      this.originalProducts = products;  // <--- Save original!
    });
  }


  openQuickAdd(product: any) {
    this.quickAddModal.open(product);
  }


  openQuickView(product: any) {
    this.quickViewModal.open(product);
  }


  openFilterSidebar() {
    this.productGrid.openSidebar();
  }

  gridClass: string = 'grid-4';

  onGridChange(columns: number) {
    this.gridClass = `grid-${columns}`;
  }


  handleSortChange(sort: string) {
    this.sortValue = sort;
    this.products = this.sortProducts([...this.originalProducts], sort);
  }

  sortProducts(products: any[], sort: string): any[] {
    switch (sort) {
      case 'Featured':
        return products; // Just show as-is, or implement logic for "featured"
      case 'Newest':
        return products.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      case 'Price: Low to High':
        return products.sort((a, b) => a.price - b.price);
      case 'Price: High to Low':
        return products.sort((a, b) => b.price - a.price);
      default:
        return products;
    }
  }

}
