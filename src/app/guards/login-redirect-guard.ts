import {CanActivate, CanActivateFn, Router} from '@angular/router';
import {map, Observable, tap} from 'rxjs';
import {Injectable} from '@angular/core';
import {AuthService} from '../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class LoginRedirectGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      tap(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/user/dashboard']); // Update with your main route
        }
      }),
      map(isAuthenticated => !isAuthenticated)
    );
  }
}
