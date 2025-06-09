// orders.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { OrderDTO } from '../../../openapi/model/order-dto';

// Interface for the paginated response
interface PaginatedOrderResponse {
  content: OrderDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sortField: string;
  sortDir: string;
  keyword: string;
  searchParams: {
    userId: number;
  };
  allowedSortFields: string[];
}

// Interface for notification messages
interface NotificationMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
}

// Interface for confirmation dialog
interface ConfirmationDialog {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: OrderDTO[] = [];
  loading = false;
  error: string | null = null;
  cancellingOrderId: number | null = null; // Track which order is being cancelled

  // Pagination properties
  currentPage = 1;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  isFirstPage = true;
  isLastPage = true;

  // Notification system
  notifications: NotificationMessage[] = [];
  private notificationIdCounter = 1;

  // Confirmation dialog
  confirmationDialog: ConfirmationDialog = {
    isVisible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
    onCancel: () => {}
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(page: number = 1, size: number = 10) {
    this.loading = true;
    this.error = null;

    // Use the correct paginated API endpoint
    const apiUrl = `http://localhost:8080/api/public/orders?pageNum=${page}&pageSize=${size}`;

    this.http.get<PaginatedOrderResponse>(apiUrl)
      .subscribe({
        next: (response) => {
          this.orders = response.content;
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.pageSize = response.pageSize;
          this.isFirstPage = response.first;
          this.isLastPage = response.last;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load orders:', error);
          this.error = 'Failed to load orders. Please try again.';
          this.loading = false;
        }
      });
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadOrders(page, this.pageSize);
    }
  }

  nextPage() {
    if (!this.isLastPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (!this.isFirstPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status?.toUpperCase()) {
      case 'PROCESSING':
        return 'status-processing';
      case 'SHIPPED':
        return 'status-shipped';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELED':
        return 'status-canceled';
      default:
        return 'status-default';
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return 'N/A';
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get order property safely - Updated to match API response
  getOrderId(order: OrderDTO): number | undefined {
    return (order as any).orderId || (order as any).id;
  }

  getOrderDate(order: OrderDTO): string | undefined {
    return (order as any).date || (order as any).orderDate || (order as any).createdDate;
  }

  getOrderStatus(order: OrderDTO): string | undefined {
    return (order as any).status || (order as any).orderStatus;
  }

  getTotalAmount(order: OrderDTO): number | undefined {
    return (order as any).price || (order as any).totalAmount || (order as any).total;
  }

  getCustomerName(order: OrderDTO): string | undefined {
    return (order as any).userName || (order as any).customerName || (order as any).user?.name;
  }

  getOrderAddress(order: OrderDTO): string | undefined {
    return (order as any).address;
  }

  getPaymentType(order: OrderDTO): string | undefined {
    return (order as any).payType || (order as any).paymentType;
  }

  // Show professional confirmation dialog
  showCancelConfirmation(order: OrderDTO) {
    const orderId = this.getOrderId(order);
    const orderIdText = orderId ? `#${orderId}` : 'this order';

    this.confirmationDialog = {
      isVisible: true,
      title: 'Cancel Order Confirmation',
      message: `Are you sure you want to cancel order ${orderIdText}? This action cannot be undone and may affect any associated shipping or processing.`,
      confirmText: 'Yes, Cancel Order',
      cancelText: 'Keep Order',
      onConfirm: () => {
        this.confirmCancelOrder(order);
        this.hideConfirmationDialog();
      },
      onCancel: () => {
        this.hideConfirmationDialog();
      }
    };
  }

  hideConfirmationDialog() {
    this.confirmationDialog.isVisible = false;
  }

  cancelOrder(order: OrderDTO) {
    this.showCancelConfirmation(order);
  }

  confirmCancelOrder(order: OrderDTO) {
    const orderId = this.getOrderId(order);

    if (!orderId) {
      this.showNotification('Unable to cancel order: Invalid order ID', 'error');
      return;
    }

    // Set loading state for this specific order
    this.cancellingOrderId = orderId;

    // Use the correct API endpoint for canceling orders with POST method
    const cancelUrl = `http://localhost:8080/api/public/orders/${orderId}/cancel`;

    this.http.post(cancelUrl, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response) => {
        console.log('Cancel order response:', response);
        this.showNotification(`Order #${orderId} has been successfully canceled`, 'success');
        this.cancellingOrderId = null;

        // Wait a moment before reloading to ensure backend has processed the change
        setTimeout(() => {
          this.loadOrders(this.currentPage, this.pageSize);
        }, 500);
      },
      error: (error) => {
        console.error('Failed to cancel order:', error);
        this.cancellingOrderId = null;

        // More specific error messages
        let errorMessage = 'Failed to cancel order. Please try again.';
        if (error.status === 404) {
          errorMessage = 'Order not found. It may have already been processed.';
        } else if (error.status === 400) {
          errorMessage = 'Order cannot be canceled at this time.';
        } else if (error.status === 500) {
          errorMessage = 'Server error occurred. Please contact support.';
        }

        this.showNotification(errorMessage, 'error');
      }
    });
  }

  canCancelOrder(status: string | undefined): boolean {
    return status?.toUpperCase() === 'PROCESSING';
  }

  // Check if specific order is being cancelled
  isOrderCancelling(orderId: number | undefined): boolean {
    return this.cancellingOrderId === orderId;
  }

  // Notification system methods
  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const notification: NotificationMessage = {
      id: this.notificationIdCounter++,
      message,
      type,
      timestamp: new Date()
    };

    this.notifications.push(notification);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }

  removeNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'warning':
        return 'notification-warning';
      case 'info':
      default:
        return 'notification-info';
    }
  }
}

// // orders.component.ts
// import { Component, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { OrderDTO } from '../../../openapi/model/order-dto';
//
// // Interface for the paginated response
// interface PaginatedOrderResponse {
//   content: OrderDTO[];
//   currentPage: number;
//   totalPages: number;
//   totalElements: number;
//   pageSize: number;
//   first: boolean;
//   last: boolean;
//   empty: boolean;
//   sortField: string;
//   sortDir: string;
//   keyword: string;
//   searchParams: {
//     userId: number;
//   };
//   allowedSortFields: string[];
// }
//
// // Interface for notification messages
// interface NotificationMessage {
//   id: number;
//   message: string;
//   type: 'success' | 'error' | 'info' | 'warning';
//   timestamp: Date;
// }
//
// // Interface for confirmation dialog
// interface ConfirmationDialog {
//   isVisible: boolean;
//   title: string;
//   message: string;
//   confirmText: string;
//   cancelText: string;
//   onConfirm: () => void;
//   onCancel: () => void;
// }
//
// @Component({
//   selector: 'app-orders',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './orders.component.html',
//   styleUrls: ['./orders.component.css']
// })
// export class OrdersComponent implements OnInit {
//   orders: OrderDTO[] = [];
//   loading = false;
//   error: string | null = null;
//   cancellingOrderId: number | null = null; // Track which order is being cancelled
//
//   // Pagination properties
//   currentPage = 1;
//   totalPages = 0;
//   totalElements = 0;
//   pageSize = 10;
//   isFirstPage = true;
//   isLastPage = true;
//
//   // Notification system
//   notifications: NotificationMessage[] = [];
//   private notificationIdCounter = 1;
//
//   // Confirmation dialog
//   confirmationDialog: ConfirmationDialog = {
//     isVisible: false,
//     title: '',
//     message: '',
//     confirmText: 'Confirm',
//     cancelText: 'Cancel',
//     onConfirm: () => {},
//     onCancel: () => {}
//   };
//
//   constructor(private http: HttpClient) {}
//
//   ngOnInit() {
//     this.loadOrders();
//   }
//
//   loadOrders(page: number = 1, size: number = 10) {
//     this.loading = true;
//     this.error = null;
//
//     // Use the correct paginated API endpoint
//     const apiUrl = `http://localhost:8080/api/public/orders?pageNum=${page}&pageSize=${size}`;
//
//     this.http.get<PaginatedOrderResponse>(apiUrl)
//       .subscribe({
//         next: (response) => {
//           this.orders = response.content;
//           this.currentPage = response.currentPage;
//           this.totalPages = response.totalPages;
//           this.totalElements = response.totalElements;
//           this.pageSize = response.pageSize;
//           this.isFirstPage = response.first;
//           this.isLastPage = response.last;
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Failed to load orders:', error);
//           this.error = 'Failed to load orders. Please try again.';
//           this.loading = false;
//         }
//       });
//   }
//
//   // Pagination methods
//   goToPage(page: number) {
//     if (page >= 1 && page <= this.totalPages) {
//       this.loadOrders(page, this.pageSize);
//     }
//   }
//
//   nextPage() {
//     if (!this.isLastPage) {
//       this.goToPage(this.currentPage + 1);
//     }
//   }
//
//   previousPage() {
//     if (!this.isFirstPage) {
//       this.goToPage(this.currentPage - 1);
//     }
//   }
//
//   getStatusClass(status: string | undefined): string {
//     switch (status?.toUpperCase()) {
//       case 'PROCESSING':
//         return 'status-processing';
//       case 'SHIPPED':
//         return 'status-shipped';
//       case 'COMPLETED':
//         return 'status-completed';
//       case 'CANCELED':
//         return 'status-canceled';
//       default:
//         return 'status-default';
//     }
//   }
//
//   formatCurrency(amount: number | undefined): string {
//     if (!amount) return 'N/A';
//     return amount.toLocaleString('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     });
//   }
//
//   formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   }
//
//   // Get order property safely
//   getOrderId(order: OrderDTO): number | undefined {
//     return (order as any).id || (order as any).orderId;
//   }
//
//   getOrderDate(order: OrderDTO): string | undefined {
//     return (order as any).orderDate || (order as any).createdDate;
//   }
//
//   getOrderStatus(order: OrderDTO): string | undefined {
//     return (order as any).status || (order as any).orderStatus;
//   }
//
//   getTotalAmount(order: OrderDTO): number | undefined {
//     return (order as any).totalAmount || (order as any).total;
//   }
//
//   getCustomerName(order: OrderDTO): string | undefined {
//     return (order as any).customerName || (order as any).userName || (order as any).user?.name;
//   }
//
//   // Show professional confirmation dialog
//   showCancelConfirmation(order: OrderDTO) {
//     const orderId = this.getOrderId(order);
//     const orderIdText = orderId ? `#${orderId}` : 'this order';
//
//     this.confirmationDialog = {
//       isVisible: true,
//       title: 'Cancel Order Confirmation',
//       message: `Are you sure you want to cancel order ${orderIdText}? This action cannot be undone and may affect any associated shipping or processing.`,
//       confirmText: 'Yes, Cancel Order',
//       cancelText: 'Keep Order',
//       onConfirm: () => {
//         this.confirmCancelOrder(order);
//         this.hideConfirmationDialog();
//       },
//       onCancel: () => {
//         this.hideConfirmationDialog();
//       }
//     };
//   }
//
//   hideConfirmationDialog() {
//     this.confirmationDialog.isVisible = false;
//   }
//
//   cancelOrder(order: OrderDTO) {
//     this.showCancelConfirmation(order);
//   }
//
//   confirmCancelOrder(order: OrderDTO) {
//     const orderId = this.getOrderId(order);
//
//     if (!orderId) {
//       this.showNotification('Unable to cancel order: Invalid order ID', 'error');
//       return;
//     }
//
//     // Set loading state for this specific order
//     this.cancellingOrderId = orderId;
//
//     // Use the correct API endpoint for canceling orders
//     const cancelUrl = `http://localhost:8080/api/public/orders/${orderId}/cancel`;
//
//     this.http.put(cancelUrl, {}, {
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     }).subscribe({
//       next: (response) => {
//         console.log('Cancel order response:', response);
//         this.showNotification(`Order #${orderId} has been successfully canceled`, 'success');
//         this.cancellingOrderId = null;
//
//         // Wait a moment before reloading to ensure backend has processed the change
//         setTimeout(() => {
//           this.loadOrders(this.currentPage, this.pageSize);
//         }, 500);
//       },
//       error: (error) => {
//         console.error('Failed to cancel order:', error);
//         this.cancellingOrderId = null;
//
//         // More specific error messages
//         let errorMessage = 'Failed to cancel order. Please try again.';
//         if (error.status === 404) {
//           errorMessage = 'Order not found. It may have already been processed.';
//         } else if (error.status === 400) {
//           errorMessage = 'Order cannot be canceled at this time.';
//         } else if (error.status === 500) {
//           errorMessage = 'Server error occurred. Please contact support.';
//         }
//
//         this.showNotification(errorMessage, 'error');
//       }
//     });
//   }
//
//   canCancelOrder(status: string | undefined): boolean {
//     return status?.toUpperCase() === 'PROCESSING';
//   }
//
//   // Check if specific order is being cancelled
//   isOrderCancelling(orderId: number | undefined): boolean {
//     return this.cancellingOrderId === orderId;
//   }
//
//   // Notification system methods
//   showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
//     const notification: NotificationMessage = {
//       id: this.notificationIdCounter++,
//       message,
//       type,
//       timestamp: new Date()
//     };
//
//     this.notifications.push(notification);
//
//     // Auto-remove notification after 5 seconds
//     setTimeout(() => {
//       this.removeNotification(notification.id);
//     }, 5000);
//   }
//
//   removeNotification(id: number) {
//     this.notifications = this.notifications.filter(n => n.id !== id);
//   }
//
//   getNotificationClass(type: string): string {
//     switch (type) {
//       case 'success':
//         return 'notification-success';
//       case 'error':
//         return 'notification-error';
//       case 'warning':
//         return 'notification-warning';
//       case 'info':
//       default:
//         return 'notification-info';
//     }
//   }
// }




// // orders.component.ts
// import { Component, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { OrderDTO } from '../../../openapi/model/order-dto';
//
// // Interface for the paginated response
// interface PaginatedOrderResponse {
//   content: OrderDTO[];
//   currentPage: number;
//   totalPages: number;
//   totalElements: number;
//   pageSize: number;
//   first: boolean;
//   last: boolean;
//   empty: boolean;
//   sortField: string;
//   sortDir: string;
//   keyword: string;
//   searchParams: {
//     userId: number;
//   };
//   allowedSortFields: string[];
// }
//
// @Component({
//   selector: 'app-orders',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './orders.component.html',
//   styleUrls: ['./orders.component.css']
// })
// export class OrdersComponent implements OnInit {
//   orders: OrderDTO[] = [];
//   loading = false;
//   error: string | null = null;
//
//   // Pagination properties
//   currentPage = 1;
//   totalPages = 0;
//   totalElements = 0;
//   pageSize = 10;
//   isFirstPage = true;
//   isLastPage = true;
//
//   constructor(private http: HttpClient) {}
//
//   ngOnInit() {
//     this.loadOrders();
//   }
//
//   loadOrders(page: number = 1, size: number = 10) {
//     this.loading = true;
//     this.error = null;
//
//     // Use the correct paginated API endpoint
//     const apiUrl = `http://localhost:8080/api/public/orders?pageNum=${page}&pageSize=${size}`;
//
//     this.http.get<PaginatedOrderResponse>(apiUrl)
//       .subscribe({
//         next: (response) => {
//           this.orders = response.content;
//           this.currentPage = response.currentPage;
//           this.totalPages = response.totalPages;
//           this.totalElements = response.totalElements;
//           this.pageSize = response.pageSize;
//           this.isFirstPage = response.first;
//           this.isLastPage = response.last;
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Failed to load orders:', error);
//           this.error = 'Failed to load orders. Please try again.';
//           this.loading = false;
//         }
//       });
//   }
//
//   // Pagination methods
//   goToPage(page: number) {
//     if (page >= 1 && page <= this.totalPages) {
//       this.loadOrders(page, this.pageSize);
//     }
//   }
//
//   nextPage() {
//     if (!this.isLastPage) {
//       this.goToPage(this.currentPage + 1);
//     }
//   }
//
//   previousPage() {
//     if (!this.isFirstPage) {
//       this.goToPage(this.currentPage - 1);
//     }
//   }
//
//   getStatusClass(status: string): string {
//     switch (status?.toUpperCase()) {
//       case 'PROCESSING':
//         return 'status-processing';
//       case 'SHIPPED':
//         return 'status-shipped';
//       case 'COMPLETED':
//         return 'status-completed';
//       case 'CANCELED':
//         return 'status-canceled';
//       default:
//         return 'status-default';
//     }
//   }
//
//   formatCurrency(amount: number | undefined): string {
//     if (!amount) return 'N/A';
//     return amount.toLocaleString('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     });
//   }
//
//   formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   }
//
//   cancelOrder(orderId: number | undefined) {
//     if (!orderId) return;
//
//     if (confirm('Are you sure you want to cancel this order?')) {
//       this.http.put(`http://localhost:8080/api/orders/${orderId}/cancel`, {})
//         .subscribe({
//           next: () => {
//             this.loadOrders(this.currentPage, this.pageSize); // Reload current page after cancellation
//           },
//           error: (error) => {
//             console.error('Failed to cancel order:', error);
//             alert('Failed to cancel order. Please try again.');
//           }
//         });
//     }
//   }
//
//   canCancelOrder(status: string | undefined): boolean {
//     return status?.toUpperCase() === 'PROCESSING';
//   }
// }
//
