import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private allProducts = [
    {
      id: 1,
      name: 'Smartphone X',
      price: 499,
      quantity: 10,
      description: 'Latest smartphone',
      categories: ['Electronics'],
      availability: 'in',
      image: ["1.jpg","2.jpg","5.jpg"]
    },
    {
      id: 2,
      name: 'T-Shirt',
      price: 29,
      quantity: 0,
      description: 'Cotton shirt',
      categories: ['Clothes'],
      availability: 'out',
      image: ["1.jpg","2.jpg","3.jpg"]

    },
    {
      id: 1,
      name: 'Smartphone X',
      price: 499,
      quantity: 10,
      description: 'Latest smartphone',
      categories: ['Electronics'],
      availability: 'in',
      image: ["1.jpg","2.jpg","3.jpg"]

    },
    {
      id: 2,
      name: 'T-Shirt',
      price: 29,
      quantity: 0,
      description: 'Cotton shirt',
      categories: ['Clothes'],
      availability: 'out',
      image: ["1.jpg","2.jpg","3.jpg"]

    },
    {
      id: 1,
      name: 'Smartphone X',
      price: 499,
      quantity: 10,
      description: 'Latest smartphone',
      categories: ['Electronics'],
      availability: 'in',
      image: ["1.jpg","2.jpg","3.jpg"]

    },
    {
      id: 2,
      name: 'T-Shirt',
      price: 29,
      quantity: 0,
      description: 'Cotton shirt',
      categories: ['Clothes'],
      availability: 'out',
      image: ["1.jpg","2.jpg","3.jpg"]
    },
  ];

  private filteredProducts$ = new BehaviorSubject<any[]>(this.allProducts);

  getProducts() {
    return this.filteredProducts$;
  }

  applyFilters(filters: {
    categoryIds: string[];
    availability: string[];
    priceRange: { min: number; max: number };
  }) {
    const filtered = this.allProducts.filter((product) => {
      const matchCategory =
        filters.categoryIds.length === 0 ||
        product.categories.some((cat: string) =>
          filters.categoryIds.includes(cat)
        );

      const matchAvailability =
        filters.availability.length === 0 ||
        filters.availability.includes(product.availability);

      const matchPrice =
        product.price >= filters.priceRange.min &&
        product.price <= filters.priceRange.max;

      return matchCategory && matchAvailability && matchPrice;
    });

    this.filteredProducts$.next(filtered);
  }

  getCategories() {
    return [
      { categoryId: 'Electronics', categoryName: 'Electronics' },
      { categoryId: 'Clothes', categoryName: 'Clothes' },
    ];
  }

  getCartSize(): number {
    return 2;
  }

  isLoggedIn(): boolean {
    return true;
  }

}
