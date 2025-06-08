import {Component, HostListener, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule, RouterOutlet} from '@angular/router';
import {AuthService} from '../../../services/auth-service';
import {Observable} from 'rxjs';
import {ToastComponent} from "../../../components/toast/toast.component";

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, ToastComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  currentUser$: Observable<any>;
  constructor(private authService: AuthService,private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }
  title = 'ecomus-admin';

  sidebarCollapsed = true; // Always start collapsed for hover behavior
  isMobile = false;
  sidebarHovered = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar() {
    // Only toggle for mobile
    if (this.isMobile) {
      this.sidebarCollapsed = !this.sidebarCollapsed;

      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        if (!this.sidebarCollapsed) {
          sidebar.classList.add('show');
        } else {
          sidebar.classList.remove('show');
        }
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.navbar .btn');

    // Only handle clicks for mobile
    if (this.isMobile &&
      sidebar &&
      !sidebar.contains(target) &&
      toggleButton &&
      !toggleButton.contains(target) &&
      !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
      sidebar.classList.remove('show');
    }
  }

  // Optional: Track hover state for additional functionality
  onSidebarMouseEnter() {
    if (!this.isMobile) {
      this.sidebarHovered = true;
    }
  }

  onSidebarMouseLeave() {
    if (!this.isMobile) {
      this.sidebarHovered = false;
    }
  }
}
