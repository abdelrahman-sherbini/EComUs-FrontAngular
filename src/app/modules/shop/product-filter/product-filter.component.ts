import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';


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
  @Output() sortChanged = new EventEmitter<string>();


  activeGrid = 4;
  dropdownOpen:boolean = false;
  selectedSort = 'Featured';
  sorts = ['Featured', 'Newest', 'Price: Low to High', 'Price: High to Low'];


  setGrid(layout: number): void {
    this.activeGrid = layout;
    this.gridChanged.emit(layout);
  }

  triggerFilter() {
    this.openFilter.emit();
  }

  setSort(sort: string) {
    this.selectedSort = sort;
    this.sortChanged.emit(sort);  // <-- EMIT when changed
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
