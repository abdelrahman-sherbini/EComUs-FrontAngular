import { Injectable } from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError} from 'rxjs';
import {AuthenticationService, Token, UserSignInDTO, UserSignUpDTO} from '../modules/openapi';
import {Router} from '@angular/router';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: string | null;
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
    isLoading: true,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();
  public isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  public isLoading$ = this.authState$.pipe(map(state => state.isLoading));
  public currentUser$ = this.authState$.pipe(map(state => ({ userId: state.userId })));

  constructor(
    private authApiService: AuthenticationService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedToken = this.getStoredToken();
    if (storedToken) {
      this.updateAuthState({
        isAuthenticated: true,
        accessToken: storedToken.accessToken,
        userId: storedToken.userId,
        isLoading: false,
        error: null
      });
    } else {
      this.updateAuthState({
        isAuthenticated: false,
        accessToken: null,
        userId: null,
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
        return throwError(() => error);
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
    this.storeToken(token);
    this.updateAuthState({
      isAuthenticated: true,
      accessToken: token.accessToken || null,
      userId: token.userId || null,
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
}
