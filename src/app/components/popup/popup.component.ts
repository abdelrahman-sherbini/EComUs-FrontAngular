import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PopupService, Popup, PopupOption } from '../../services/popup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit, OnDestroy {
  popups: Popup[] = [];
  private subscription: Subscription | null = null;

  @ViewChild('customContainer', { read: ViewContainerRef }) customContainer!: ViewContainerRef;

  constructor(
    private popupService: PopupService,
    private router: Router,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {
    this.subscription = this.popupService.popups$.subscribe(popups => {
      this.popups = popups;

      // Handle backdrop and body scrolling
      if (popups.length > 0) {
        document.body.classList.add('popup-open');
      } else {
        document.body.classList.remove('popup-open');
      }

      // Render custom components if needed
      setTimeout(() => {
        this.renderCustomComponents();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    document.body.classList.remove('popup-open');
  }

  selectOption(popup: Popup, option: PopupOption): void {
    // Handle special login/register navigation
    if (option.value === 'login') {
      this.router.navigate(['/login']);
    } else if (option.value === 'register') {
      this.router.navigate(['/register']);
    }

    this.popupService.selectOption(popup.id, option);
  }

  closePopup(popup: Popup): void {
    this.popupService.removePopup(popup.id);
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  private renderCustomComponents(): void {
    if (!this.customContainer) return;

    this.customContainer.clear();

    this.popups.forEach(popup => {
      if (popup.type === 'custom' && popup.component) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(popup.component);
        const componentRef = this.customContainer.createComponent<any>(componentFactory);

        // Pass props to the component
        if (popup.componentProps) {
          Object.keys(popup.componentProps).forEach(key => {
            componentRef.instance[key] = popup.componentProps[key];
          });
        }
      }
    });
  }
}
