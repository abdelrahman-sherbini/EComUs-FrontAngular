// toast.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {Toast, ToastService} from '../../services/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],


})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(
        (toasts: Toast[]) => this.toasts = toasts
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  getToastClasses(toast: Toast): string {
    return `toast-${toast.type}`;
  }

  getIconClass(type: string): string {
    const iconMap: { [key: string]: string } = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return iconMap[type] || 'fas fa-info-circle';
  }
}
