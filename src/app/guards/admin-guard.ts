import {ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../services/auth-service';
import {Observable, tap} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Observable<boolean> {
    return this.authService.isAdmin$.pipe(
      tap( isAdmin => {
        if (!isAdmin) {
          this.authService.navigateToForbiddenPage();
          // this.router.navigate(['/login'], {
          //   queryParams: { returnUrl: state.url }
          // });
        }
      })
    );
  }
};
