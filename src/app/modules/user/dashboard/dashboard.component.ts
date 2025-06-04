import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../services/auth-service';
import {Observable} from 'rxjs';
import {AsyncPipe, CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [
    AsyncPipe,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser$: Observable<any>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Component initialization
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful, navigation handled by auth service
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
