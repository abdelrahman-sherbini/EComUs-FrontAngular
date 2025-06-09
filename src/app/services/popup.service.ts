import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PopupOption {
  text: string;
  value: any;
  style?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  action?: () => void;
}

export interface Popup {
  id: string;
  type: 'alert' | 'confirm' | 'prompt' | 'custom';
  title?: string;
  message: string;
  options?: PopupOption[];
  inputPlaceholder?: string;
  inputValue?: string;
  inputType?: string;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customClass?: string;
  backdrop?: boolean;
  centered?: boolean;
  component?: any;
  componentProps?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupsSubject = new BehaviorSubject<Popup[]>([]);
  public popups$: Observable<Popup[]> = this.popupsSubject.asObservable();

  constructor() {}

  /**
   * Show a simple alert popup with a message and OK button
   */
  showAlert(message: string, title?: string, options?: Partial<Popup>): string {
    return this.addPopup({
      type: 'alert',
      title: title || 'Alert',
      message,
      options: [{ text: 'OK', value: true, style: 'primary' }],
      showClose: true,
      ...options
    });
  }

  /**
   * Show a confirmation popup with customizable options
   * @returns The ID of the popup for tracking responses
   */
  showConfirm(
    message: string,
    options: PopupOption[] = [
      { text: 'Cancel', value: false, style: 'secondary' },
      { text: 'OK', value: true, style: 'primary' }
    ],
    title?: string,
    popupOptions?: Partial<Popup>
  ): string {
    return this.addPopup({
      type: 'confirm',
      title: title || 'Confirm',
      message,
      options,
      showClose: true,
      ...popupOptions
    });
  }

  /**
   * Show a prompt popup with an input field
   */
  showPrompt(
    message: string,
    inputPlaceholder?: string,
    inputValue?: string,
    inputType: string = 'text',
    options: PopupOption[] = [
      { text: 'Cancel', value: null, style: 'secondary' },
      { text: 'OK', value: true, style: 'primary' }
    ],
    title?: string,
    popupOptions?: Partial<Popup>
  ): string {
    return this.addPopup({
      type: 'prompt',
      title: title || 'Input Required',
      message,
      inputPlaceholder,
      inputValue,
      inputType,
      options,
      showClose: true,
      ...popupOptions
    });
  }

  /**
   * Show a login prompt popup
   */
  showLoginPrompt(message: string = 'Please log in to continue'): string {
    return this.showConfirm(
      message,
      [
        { text: 'Cancel', value: 'cancel', style: 'secondary' },
        { text: 'Register', value: 'register', style: 'info' },
        { text: 'Login', value: 'login', style: 'primary' }
      ],
      'Login Required'
    );
  }

  /**
   * Show a custom popup with any content
   */
  showCustom(component: any, componentProps?: any, options?: Partial<Popup>): string {
    return this.addPopup({
      type: 'custom',
      component,
      componentProps,
      message: options?.message || '', // Provide a default empty string for message
      showClose: true,
      ...options
    });
  }

  /**
   * Handle popup option selection
   */
  selectOption(popupId: string, option: PopupOption): void {
    const popups = this.popupsSubject.value;
    const popupIndex = popups.findIndex(p => p.id === popupId);

    if (popupIndex !== -1) {
      // Execute the option's action if provided
      if (option.action) {
        option.action();
      }

      // Remove the popup
      this.removePopup(popupId);
    }
  }

  /**
   * Remove a specific popup
   */
  removePopup(id: string): void {
    const popups = this.popupsSubject.value;
    const filteredPopups = popups.filter(popup => popup.id !== id);
    this.popupsSubject.next(filteredPopups);
  }

  /**
   * Clear all popups
   */
  clearAll(): void {
    this.popupsSubject.next([]);
  }

  /**
   * Add a new popup
   * @returns The ID of the added popup
   */
  private addPopup(popup: Omit<Popup, 'id'>): string {
    const id = this.generateId();
    const newPopup: Popup = {
      ...popup,
      id
    };

    const currentPopups = this.popupsSubject.value;
    this.popupsSubject.next([...currentPopups, newPopup]);

    return id;
  }

  /**
   * Generate a unique ID for the popup
   */
  private generateId(): string {
    return 'popup_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
