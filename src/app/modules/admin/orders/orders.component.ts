import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  AdminOrdersService,
  AdminOrdersServiceInterface,
  OrderDTO,
  OrderStatusDTO,
  PagedResponseOrderDTO
} from '../../openapi';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {CommonModule} from '@angular/common';
import {RouterModule, RouterOutlet} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../../../services/toast';

interface StatusOption {
  label: string;
  value: string;
  icon: string;
  color: string;
  count: number;
}


@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data properties
  orders: OrderDTO[] = [];
  pagedResponse: PagedResponseOrderDTO | null = null;
  selectedOrder: OrderDTO | null = null;

  // State properties
  loading = false;
  error: string | null = null;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Sorting properties
  sortField: string = 'orderId';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filter properties
  currentFilter = 'all';
  searchKeyword = '';
  showAdvancedFilters = false;

  // Advanced filter properties
  priceMin: number | null = null;
  priceMax: number | null = null;
  orderIdMin: number | null = null;
  orderIdMax: number | null = null;
  addressFilter = '';
  payTypeFilter = 'all';
  userIdFilter: number | null = null;

  // Status options with counts
  statusOptions: StatusOption[] = [
    { label: 'All Orders', value: 'all', icon: 'fas fa-list', color: 'primary', count: 0 },
    { label: 'Processing', value: 'PROCESSING', icon: 'fas fa-clock', color: 'warning', count: 0 },
    { label: 'Shipped', value: 'SHIPPED', icon: 'fas fa-shipping-fast', color: 'info', count: 0 },
    { label: 'Completed', value: 'COMPLETED', icon: 'fas fa-check-circle', color: 'success', count: 0 },
    { label: 'Canceled', value: 'CANCELED', icon: 'fas fa-times-circle', color: 'danger', count: 0 }
  ];

  constructor(private ordersService: AdminOrdersService,private toastService:ToastService) {}

  ngOnInit(): void {
    this.initializeSearchDebounce();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchKeyword = searchTerm;
      this.currentPage = 1;
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    const params = this.buildRequestParams();

    this.ordersService.getOrders1(
      params.pageNum,
      params.pageSize,
      params.sortField as any,
      params.sortDir,
      params.keyword,
      params.priceMin,
      params.priceMax,
      params.orderIdMax,
      params.orderIdMin,
      params.address,
      params.status as any,
      params.payType as any,
      params.userId
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.orders = response.content || [];
        this.updateStatusCounts();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load orders. Please try again.';
        this.loading = false;
        this.toastService.showError('Error loading orders:', error);
      }
    });
  }

  private buildRequestParams(): any {
    return {
      pageNum: this.currentPage,
      pageSize: this.pageSize,
      sortField: this.sortField,
      sortDir: this.sortDirection,
      keyword: this.searchKeyword || undefined,
      priceMin: this.priceMin || undefined,
      priceMax: this.priceMax || undefined,
      orderIdMax: this.orderIdMax || undefined,
      orderIdMin: this.orderIdMin || undefined,
      address: this.addressFilter || undefined,
      status: this.currentFilter !== 'all' ? this.currentFilter : undefined,
      payType: this.payTypeFilter !== 'all' ? this.payTypeFilter : undefined,
      userId: this.userIdFilter || undefined
    };
  }

  // private updateStatusCounts(): void {
  //   // Update counts based on current data (simplified approach)
  //   // In a real app, you might want to fetch these counts separately
  //   const totalCount = this.pagedResponse?.totalElements || 0;
  //   this.statusOptions[0].count = totalCount;
  //
  //   // Reset other counts (would need separate API calls for accurate counts)
  //   for (let i = 1; i < this.statusOptions.length; i++) {
  //     this.statusOptions[i].count = 0;
  //   }
  //
  //   // Count current page items
  //   this.orders.forEach(order => {
  //     const statusOption = this.statusOptions.find(opt => opt.value === order.status);
  //     if (statusOption) {
  //       statusOption.count++;
  //     }
  //   });
  // }

  private updateStatusCounts(): void {
    // Get count for all orders
    this.ordersService.getOrders1(1, 1, 'orderId', 'desc', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.statusOptions[0].count = response.totalElements || 0;
      });

    // Get count for each status
    const statuses = ['PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELED'];
    statuses.forEach((status, index) => {
      this.ordersService.getOrders1(1, 1, 'orderId', 'desc', undefined, undefined, undefined, undefined, undefined, undefined, status as any, undefined, undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          this.statusOptions[index + 1].count = response.totalElements || 0;
        });
    });
  }

  // Filter and Search Methods
  onFilterChange(status: string): void {
    this.currentFilter = status;
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target.value;
    this.searchSubject.next(searchTerm);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearAdvancedFilters(): void {
    this.priceMin = null;
    this.priceMax = null;
    this.orderIdMin = null;
    this.orderIdMax = null;
    this.addressFilter = '';
    this.payTypeFilter = 'all';
    this.userIdFilter = null;
    this.searchKeyword = '';
    this.currentFilter = 'all';
    this.currentPage = 1;
    this.loadOrders();
  }

  applyAdvancedFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  // Sorting Methods
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadOrders();
  }

  // Pagination Methods
  onPageChange(page: number): void {
    if (page >= 1 && page <= (this.pagedResponse?.totalPages || 0)) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadOrders();
  }

  getPaginationArray(): number[] {
    const totalPages = this.pagedResponse?.totalPages || 0;
    const currentPage = this.currentPage;
    const delta = 2;

    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages , currentPage + delta);

    if (end - start < 2 * delta) {
      if (start === 1) {
        end = Math.min(totalPages, start + 2 * delta);
      } else if (end === totalPages) {
        start = Math.max(1, end - 2 * delta);
      }
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Order Actions
  public viewOrderDetails(order: OrderDTO): void {
    // Load full order details if needed
    if (order.orderId) {
      this.ordersService.getOrderById1(order.orderId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (fullOrder) => {
          this.selectedOrder = fullOrder;
        },
        error: (error) => {
          this.toastService.showError('Error loading order details:', error);
          this.selectedOrder = order; // Fall back to basic order data
        }
      });
    } else {
      this.selectedOrder = order;
    }
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    const statusDto: OrderStatusDTO = {
      status: newStatus as OrderStatusDTO.StatusEnum
    };

    this.ordersService.updateOrderStatus(orderId, statusDto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedOrder) => {
        // Update the order in the current list
        const index = this.orders.findIndex(o => o.orderId === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }

        // Update selected order if it's the same one
        if (this.selectedOrder?.orderId === orderId) {
          this.selectedOrder = updatedOrder;
        }

        // Show success message (you might want to add a toast service)
        this.toastService.showSuccess('Order status updated successfully');
      },
      error: (error) => {
        this.toastService.showError('Error updating order status:', error);
        this.error = 'Failed to update order status. Please try again.';
      }
    });
  }

  // Utility Methods
  trackByOrderId(index: number, order: OrderDTO): any {
    return order.orderId;
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    const baseClass = 'badge status-badge';
    switch (status) {
      case 'PROCESSING':
        return `${baseClass} badge-warning`;
      case 'SHIPPED':
        return `${baseClass} badge-info`;
      case 'COMPLETED':
        return `${baseClass} badge-success`;
      case 'CANCELED':
        return `${baseClass} badge-danger`;
      default:
        return `${baseClass} badge-secondary`;
    }
  }

  getPaymentTypeBadgeClass(payType: string | undefined): string {
    const baseClass = 'badge payment-badge';
    switch (payType) {
      case 'CASH':
        return `${baseClass} badge-success`;
      case 'CREDIT':
        return `${baseClass} badge-primary`;
      default:
        return `${baseClass} badge-secondary`;
    }
  }

  getValidNextStatuses(currentStatus: OrderStatusDTO.StatusEnum | undefined): OrderStatusDTO.StatusEnum[]{
    switch (currentStatus) {
      case 'PROCESSING':
        return ['SHIPPED', 'CANCELED'];
      case 'SHIPPED':
        return ['COMPLETED'];
      case 'COMPLETED':
      case 'CANCELED':
        return []; // No further transitions
      default:
        return [];
    }
  }

  canTransitionTo(
    currentStatus: OrderStatusDTO.StatusEnum | undefined,
    newStatus: OrderStatusDTO.StatusEnum | undefined
  ): boolean {
    if (!currentStatus || !newStatus) return false;
    return this.getValidNextStatuses(currentStatus).includes(newStatus);
  }

  getStatusTransitionInfo(status: OrderStatusDTO.StatusEnum | undefined) {
    const statusInfo: Record<OrderStatusDTO.StatusEnum, { icon: string; color: string; label: string }> = {
      PROCESSING: { icon: 'fa-clock', color: 'text-warning', label: 'Processing' },
      SHIPPED: { icon: 'fa-shipping-fast', color: 'text-info', label: 'Shipped' },
      COMPLETED: { icon: 'fa-check-circle', color: 'text-success', label: 'Completed' },
      CANCELED: { icon: 'fa-times-circle', color: 'text-danger', label: 'Canceled' }
    };

    return status ? statusInfo[status] : { icon: 'fa-question', color: 'text-secondary', label: status };
  }

  readonly statusList: OrderStatusDTO.StatusEnum[] = [
    OrderStatusDTO.StatusEnum.Processing,
    OrderStatusDTO.StatusEnum.Shipped,
    OrderStatusDTO.StatusEnum.Completed,
    OrderStatusDTO.StatusEnum.Canceled
  ];

  // Expose Math for template
  Math = Math;
}
