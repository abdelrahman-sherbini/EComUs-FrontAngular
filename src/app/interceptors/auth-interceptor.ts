import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import {BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError} from 'rxjs';
import {Injectable} from '@angular/core';
import {AuthService} from '../services/auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth header for authentication endpoints
    if (this.isAuthEndpoint(req.url)) {
      console.log("Skipping auth header for endpoint: " + req.url);
      return next.handle(req);
    }

    // Add auth header if user is authenticated
    const authReq = this.addAuthHeader(req);

    // console.log("AuthReq is a sop "+ authReq);
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.authService.isAuthenticated()) {
          return this.handle401Error(authReq, next);
        }else if (error.status === 403) {
          console.error('Access forbidden: You do not have permission to access this resource.');
          this.authService.navigateToForbiddenPage();
        }else if (error.status === 500) {
          console.error('Internal server error: Please try again later.');
          // this.authService.navigateToErrorPage();
        }
        return throwError(() => error);
      })
    );
  }

  private addAuthHeader(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();
    // console.log('Adding Authorization header:', token);
    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return req;
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addAuthHeader(req));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.navigateToLogin();
          return throwError(() => error);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next.handle(this.addAuthHeader(req)))
      );
    }
  }

  private isAuthEndpoint(url: string): boolean {
    return url.includes('/api/auth/');
  }
}
