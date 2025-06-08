// toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  showCloseButton?: boolean;
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private defaultDuration = 5000; // 5 seconds

  constructor() {}

  // Show success toast
  showSuccess(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'success',
      title: title || 'Success',
      message,
      duration: duration || this.defaultDuration,
      autoClose: true,
      showCloseButton: true
    });
  }

  // Show error toast
  showError(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'error',
      title: title || 'Error',
      message,
      duration: duration || 8000, // Longer for errors
      autoClose: true,
      showCloseButton: true
    });
  }

  // Show warning toast
  showWarning(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration: duration || this.defaultDuration,
      autoClose: true,
      showCloseButton: true
    });
  }

  // Show info toast
  showInfo(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'info',
      title: title || 'Information',
      message,
      duration: duration || this.defaultDuration,
      autoClose: true,
      showCloseButton: true
    });
  }

  // Add custom toast
  addToast(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      autoClose: toast.autoClose !== false,
      showCloseButton: toast.showCloseButton !== false
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto remove toast after duration
    if (newToast.autoClose && newToast.duration) {
      setTimeout(() => {
        this.removeToast(newToast.id);
      }, newToast.duration);
    }
  }

  // Remove specific toast
  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  // Clear all toasts
  clearAll(): void {
    this.toastsSubject.next([]);
  }

  // Generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Get current toasts count
  getToastsCount(): number {
    return this.toastsSubject.value.length;
  }

  // Check if there are any toasts
  hasToasts(): boolean {
    return this.toastsSubject.value.length > 0;
  }
}
