



import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CustomerCartService,
  CustomerAddressesService,
  CustomerOrdersService,
  CustomerProfileService,
  CartDTO,
  AddressDTO,
  CheckOutOrderDTO,
  UserDTO
} from '../../openapi';
import {ShoppingService} from '../../../services/shopping.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  // Customer Information
  customerInfo = {
    name: '',
    townCity: '',
    area: '',
    street: '',
    buildingNumber: '',
    phoneNumber: ''
  };

  // Order data
  cartItems: CartDTO[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;
  loading: boolean = false;
  error: string = '';

  // Payment and terms
  selectedPaymentType: CheckOutOrderDTO.PayTypeEnum = CheckOutOrderDTO.PayTypeEnum.Credit;
  termsAccepted: boolean = false;
  orderAttempted: boolean = false;

  // Available addresses
  savedAddresses: AddressDTO[] = [];
  useExistingAddress: boolean = false;
  selectedAddressId: number | null = null;

  // User data
  currentUser: UserDTO | null = null;

  // Success state
  orderSuccess: boolean = false;
  successMessage: string = '';
  createdOrderId: number | null = null;

  constructor(
    private shoppingService: ShoppingService,
    private cartService: CustomerCartService,
    private addressService: CustomerAddressesService,
    private orderService: CustomerOrdersService,
    private profileService: CustomerProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadCartSummary();
    this.loadSavedAddresses();
  }

  loadUserProfile(): void {
    // Use the profile service which gets the current authenticated user
    this.profileService.profile().subscribe({
      next: (user) => {
        this.currentUser = user;
        // Pre-populate name and phone from user profile
        if (this.currentUser) {
          this.customerInfo.name = this.currentUser.userName || '';
          this.customerInfo.phoneNumber = this.currentUser.phone || '';
        }
        console.log('User profile loaded:', this.currentUser);
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.error = 'Failed to load user profile. Please try refreshing the page.';
      }
    });
  }

  loadCartSummary(): void {
    this.loading = true;

    // Load cart items for display
    this.cartService.getCartItems(1, 100).subscribe({
      next: (response) => {
        this.cartItems = response.content || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cart items:', error);
        this.loading = false;
      }
    });

    // Load totals
    this.cartService.getTotalPrice().subscribe({
      next: (total) => this.totalPrice = total,
      error: (error) => console.error('Error loading total price:', error)
    });

    this.cartService.getTotalQuantity().subscribe({
      next: (total) => this.totalQuantity = total,
      error: (error) => console.error('Error loading total quantity:', error)
    });
  }

  loadSavedAddresses(): void {
    this.addressService.getAllAddresses().subscribe({
      next: (addresses) => {
        this.savedAddresses = addresses;
        // If user has saved addresses, default to using existing address
        if (this.savedAddresses.length > 0) {
          this.useExistingAddress = true;
          this.selectedAddressId = this.savedAddresses[0].id || null;
          this.onExistingAddressChange();
        }
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
      }
    });
  }

  onAddressTypeChange(): void {
    if (this.useExistingAddress && this.savedAddresses.length > 0) {
      // If no address is selected yet, select the first one
      if (!this.selectedAddressId && this.savedAddresses[0].id) {
        this.selectedAddressId = this.savedAddresses[0].id;
      }
      this.onExistingAddressChange();
    } else {
      this.selectedAddressId = null;
      // Clear address fields when switching to new address
      this.customerInfo.area = '';
      this.customerInfo.street = '';
      this.customerInfo.buildingNumber = '';
      this.customerInfo.townCity = '';
    }
  }

  onExistingAddressChange(): void {
    if (this.selectedAddressId) {
      // Convert selectedAddressId to number for proper comparison
      const selectedId = typeof this.selectedAddressId === 'string'
        ? parseInt(this.selectedAddressId, 10)
        : this.selectedAddressId;

      const selectedAddress = this.savedAddresses.find(addr => addr.id === selectedId);

      if (selectedAddress) {
        // Update the customer info with the selected address details
        this.customerInfo.area = selectedAddress.area || '';
        this.customerInfo.street = selectedAddress.street || '';
        this.customerInfo.buildingNumber = selectedAddress.buildingNo || '';
        this.customerInfo.townCity = selectedAddress.city || '';

      } else {
        console.error('Address not found with ID:', selectedId);
        console.log('Available addresses:', this.savedAddresses);
      }
    }
  }

  getAddressString(): string {
    if (this.useExistingAddress && this.selectedAddressId) {
      const selectedAddress = this.savedAddresses.find(addr => addr.id === this.selectedAddressId);
      if (selectedAddress) {
        return `${selectedAddress.area}, ${selectedAddress.street}, ${selectedAddress.buildingNo}, ${selectedAddress.city}`;
      }
    }

    return `${this.customerInfo.area}, ${this.customerInfo.street}, ${this.customerInfo.buildingNumber}, ${this.customerInfo.townCity}`;
  }

  isFormValid(): boolean {
    return !!(
      this.customerInfo.name.trim() &&
      this.customerInfo.townCity.trim() &&
      this.customerInfo.area.trim() &&
      this.customerInfo.street.trim() &&
      this.customerInfo.buildingNumber.trim() &&
      this.customerInfo.phoneNumber.trim() &&
      this.termsAccepted
    );
  }

  confirmOrder(): void {
    this.orderAttempted = true;
    this.error = '';
    this.orderSuccess = false; // Reset success state

    if (!this.isFormValid()) {
      this.error = 'Please fill in all required fields and accept the terms and conditions.';
      return;
    }

    this.loading = true;

    // Prepare checkout data - send address as JSON string if backend expects it
    const addressObject = {
      city: this.customerInfo.townCity,
      area: this.customerInfo.area,
      street: this.customerInfo.street,
      buildingNo: this.customerInfo.buildingNumber
    };

    const checkoutData: CheckOutOrderDTO = {
      address: this.customerInfo.townCity+ " ,"+this.customerInfo.area+ ", "+ this.customerInfo.street+" , "+this.customerInfo.buildingNumber,
      payType: this.selectedPaymentType
    };

    // Create order
    this.orderService.createOrder(checkoutData).subscribe({
      next: (order) => {
        console.log('Order created successfully:', order);

        // Save address if it's new and user wants to save it
        if (!this.useExistingAddress) {
          this.saveNewAddress();
        }

        // Set success state
        this.loading = false;
        this.orderSuccess = true;
        this.createdOrderId = order.orderId || null;
        this.successMessage = `Your order has been placed successfully! Order ID: ${order.orderId}`;
        this.error = ''; // Clear any previous errors
        this.shoppingService.refreshCounts();

      },
      error: (error) => {
        this.loading = false;
        this.orderSuccess = false;

        if (error.error && error.error.message) {
          this.error = error.error.message;
        } else {
          this.error = `Failed to create order. ${error.status === 402 ? 'Payment required.' : 'Please try again.'}`;
        }

        console.error('Error creating order:', error);
      }
    });
  }

  private saveNewAddress(): void {
    const newAddress: AddressDTO = {
      city: this.customerInfo.townCity,
      area: this.customerInfo.area,
      street: this.customerInfo.street,
      buildingNo: this.customerInfo.buildingNumber
    };

    this.addressService.createAddress(newAddress).subscribe({
      next: (savedAddress) => {
        console.log('Address saved:', savedAddress);
      },
      error: (error) => {
        console.error('Error saving address:', error);
      }
    });
  }

  // NEW METHOD: Close success modal
  closeSuccessModal(): void {
    this.orderSuccess = false;
    this.createdOrderId = null;
    this.successMessage = '';
  }

  // NEW METHOD: Continue shopping
  continueShoppingOrGoHome(): void {
    this.closeSuccessModal();
    this.router.navigate(['/']); // Navigate to home page
  }

  // NEW METHOD: View order details
  viewOrderDetails(): void {
    if (this.createdOrderId) {
      this.closeSuccessModal();
      this.router.navigate(['/user/account'], {
        queryParams: { tab: 'orders' }
      });
    }
  }

  goBackToCart(): void {
    this.router.navigate(['/user/cart']);
  }

  getItemTotal(item: CartDTO): number {
    return (item.product?.price || 0) * (item.quantity || 0);
  }
}
