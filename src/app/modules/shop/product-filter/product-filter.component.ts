import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';

type SortOption = {
  display: string;
  field: string;
  direction: 'asc' | 'desc';
};

@Component({
  selector: 'app-product-filter',
  imports: [
    FormsModule,
    NgForOf,
    NgSwitch,
    NgSwitchCase,
    NgIf
  ],
  templateUrl: './product-filter.component.html',
  styleUrl: './product-filter.component.css',

})
export class ProductFilterComponent implements OnInit,OnDestroy{
  @Output() gridChanged = new EventEmitter<number>();
  @Output() openFilter = new EventEmitter<void>();
  @Output() sortChanged = new EventEmitter<{field: string, direction: 'asc' | 'desc'}>();


  activeGrid = 4;
  dropdownOpen:boolean = false;


  setGrid(layout: number): void {
    this.activeGrid = layout;
    this.gridChanged.emit(layout);
  }

  triggerFilter() {
    this.openFilter.emit();
  }

  sortOptions: SortOption[] = [
    { display: 'Sort ↑↓', field: 'productId', direction: 'asc' },
    { display: 'Name: a → z', field: 'productName', direction: 'asc' },
    { display: 'Name: z → a', field: 'productName', direction: 'desc' },
    { display: 'Price: Low to High', field: 'price', direction: 'asc' },
    { display: 'Price: High to Low', field: 'price', direction: 'desc' },
    { display: 'The Most Purchased', field: 'purchaseCount', direction: 'desc' },
    { display: 'Category', field: 'categories', direction: 'asc' }
  ];

  selectedSort = this.sortOptions[0].display;

  setSort(sortDisplay: string) {
    const selectedOption = this.sortOptions.find(opt => opt.display === sortDisplay) || this.sortOptions[0];
    this.selectedSort = selectedOption.display;
    this.sortChanged.emit({
      field: selectedOption.field,
      direction: selectedOption.direction
    });
  }

// Only button toggles dropdown
  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

// Close dropdown when a sort is selected
  setSortAndClose(sort: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.setSort(sort);      // sets + emits
    this.dropdownOpen = false;
  }

// Close when clicking outside
  ngOnInit() {
    document.addEventListener('click', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }
  handleClickOutside = () => {
    if (this.dropdownOpen) this.dropdownOpen = false;
  }

// Bonus: Keyboard accessibility (Esc to close, Enter/Space to select)
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.dropdownOpen) {
      this.dropdownOpen = false;
      (event.target as HTMLElement).blur();
      event.preventDefault();
    }
  }

}
