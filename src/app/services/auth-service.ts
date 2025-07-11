import { Injectable } from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError} from 'rxjs';
import {AuthenticationService, Token, UserSignInDTO, UserSignUpDTO} from '../modules/openapi';
import {Router} from '@angular/router';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: string | null;
  roles: string[] | null;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly STORAGE_KEY = 'auth_token';
  private refreshInProgress = false;
  private refreshSubject = new BehaviorSubject<Token | null>(null);

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    userId: null,
    roles: null,
    email: null,
    name: null,
    isAdmin: false,
    isLoading: true,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();
  public isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  public isLoading$ = this.authState$.pipe(map(state => state.isLoading));
  public isAdmin$ = this.authState$.pipe(map(state => state.isAdmin));
  public currentUser$ = this.authState$.pipe(map(state => ({
    userId: state.userId,
    email: state.email,
    roles: state.roles,
    name: state.name,
    isAdmin: state.isAdmin
  })));

  constructor(
    private authApiService: AuthenticationService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedToken = this.getStoredToken();
    if (storedToken) {
      const tokenData = this.decodeToken(storedToken.accessToken);
      this.updateAuthState({
        isAuthenticated: true,
        accessToken: storedToken.accessToken,
        userId: storedToken.userId,
        email: tokenData.email || null,
        roles: tokenData.roles || null,
        name: tokenData.name || null,
        isAdmin: this.checkIsAdmin(tokenData.roles || []),
        isLoading: false,
        error: null
      });
    } else {
      this.updateAuthState({
        isAuthenticated: false,
        accessToken: null,
        userId: null,
        email: null,
        roles: null,
        name: null,
        isAdmin: false,
        isLoading: false,
        error: null
      });
    }
  }

  /**
   * Login user with email and password
   */
  login(credentials: UserSignInDTO): Observable<Token> {
    this.updateAuthState({ ...this.getCurrentState(), isLoading: true, error: null });

    return this.authApiService.login(credentials).pipe(
      tap(token => {
        this.handleAuthSuccess(token);
      }),
      catchError(error => {
        this.handleAuthError('Login failed. Please check your credentials.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(userData: UserSignUpDTO): Observable<Token> {
    this.updateAuthState({ ...this.getCurrentState(), isLoading: true, error: null });

    return this.authApiService.register(userData).pipe(
      tap(token => {
        this.handleAuthSuccess(token);
      }),
      catchError(error => {
        this.handleAuthError('Registration failed. Please try again.');
        let errorMessage = 'Registration failed. Please try again.';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 409) {
          errorMessage = 'Email or username already exists.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid registration data. Please check your inputs.';
        }

        this.updateAuthState({ isLoading: false, error: errorMessage });
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.authApiService.logout().pipe(
      tap(() => {
        this.handleLogout();
      }),
      catchError(error => {
        // Even if logout fails on server, clear local state
        this.handleLogout();
        return of(null);
      })
    );
  }

  /**
   * Refresh access token using refresh token from cookie
   */
  refreshToken(): Observable<Token> {
    if (this.refreshInProgress) {
      return this.refreshSubject.pipe(
        switchMap(token => token ? of(token) : throwError(() => new Error('Token refresh failed')))
      );
    }

    this.refreshInProgress = true;
    this.refreshSubject.next(null);

    return this.authApiService.token().pipe(
      tap(token => {
        this.handleAuthSuccess(token);
        this.refreshSubject.next(token);
        this.refreshInProgress = false;
      }),
      catchError(error => {
        this.handleLogout();
        this.refreshSubject.error(error);
        this.refreshInProgress = false;
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.getCurrentState().accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentState().isAuthenticated;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.getCurrentState().isAdmin;
  }

  /**
   * Get current user email
   */
  getCurrentUserEmail(): string | null {
    return this.getCurrentState().email;
  }

  /**
   * Get current user roles
   */
  getCurrentUserRoles(): string[] | null {
    return this.getCurrentState().roles;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const roles = this.getCurrentState().roles;
    return roles ? roles.includes(role) : false;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.getCurrentState().userId;
  }

  /**
   * Check if token is expired (basic check - you might want to decode JWT for precise expiry)
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to dashboard or home page after login
   */
  navigateAfterLogin(): void {
    this.router.navigate(['/user/dashboard']); // Update with your app's main route
  }

  private handleAuthSuccess(token: Token): void {
    const tokenData = this.decodeToken(token.accessToken || '');
    this.storeToken(token);
    this.updateAuthState({
      isAuthenticated: true,
      accessToken: token.accessToken || null,
      userId: token.userId || null,
      email: tokenData.email || null,
      roles: tokenData.roles || null,
      name: tokenData.name || null,
      isAdmin: this.checkIsAdmin(tokenData.roles || []),
      isLoading: false,
      error: null
    });
  }

  private handleAuthError(errorMessage: string): void {
    this.clearStoredToken();
    this.updateAuthState({
      isAuthenticated: false,
      accessToken: null,
      userId: null,
      email: null,
      roles: null,
      name: null,
      isAdmin: false,
      isLoading: false,
      error: errorMessage
    });
  }

  private handleLogout(): void {
    this.clearStoredToken();
    this.updateAuthState({
      isAuthenticated: false,
      accessToken: null,
      userId: null,
      email: null,
      roles: null,
      name: null,
      isAdmin: false,
      isLoading: false,
      error: null
    });
    this.navigateToLogin();
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    const currentState = this.getCurrentState();
    this.authStateSubject.next({ ...currentState, ...newState });
  }

  private getCurrentState(): AuthState {
    return this.authStateSubject.value;
  }

  private storeToken(token: Token): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        accessToken: token.accessToken,
        userId: token.userId
      }));
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  private getStoredToken(): { accessToken: string; userId: string } | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve stored token:', error);
      return null;
    }
  }

  private clearStoredToken(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored token:', error);
    }
  }

  /**
   * Decode JWT token to extract claims
   */
  private decodeToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return {};
    }
  }

  /**
   * Check if user has admin role
   */
  private checkIsAdmin(roles: string[]): boolean {
    // Adjust these role names based on your actual role structure
    const adminRoles = ['ROLE_ADMIN', 'ADMIN', 'admin'];
    return roles.some(role => adminRoles.includes(role));
  }

  navigateToForbiddenPage() {
    this.router.navigate(['/login']);

  }
}
