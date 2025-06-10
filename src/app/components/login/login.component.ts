import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {UserSignInDTO} from '../../modules/openapi';
import {AuthService} from '../../services/auth-service';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, FormsModule, RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/user/dashboard';

    // Subscribe to auth state for loading and error handling
    this.authService.authState$.subscribe(state => {
      this.isLoading = state.isLoading;
      this.errorMessage = state.error || '';

      if (state.isAuthenticated) {
        this.router.navigate([this.returnUrl]);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: UserSignInDTO = this.loginForm.value;
      this.authService.login(credentials).subscribe({
        next: () => {
          // Navigation is handled by the auth state subscription
        },
        error: (error) => {
          console.error('Login error:', error);
          // Error message is handled by the auth state subscription
        }
      });
    }
  }

  forgotPassword(): void {
    this.router.navigate(['/password-reset']);
  }
}
