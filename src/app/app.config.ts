import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi} from '@angular/common/http';
import {BASE_PATH, Configuration} from './modules/openapi';
import {AuthInterceptor} from './interceptors/auth-interceptor';
import {environment} from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: BASE_PATH, useValue: `${environment.apiUrl}` },
    {provide:HTTP_INTERCEPTORS, useClass: AuthInterceptor,multi: true},
    {
      provide: Configuration,
      useValue: new Configuration({
        basePath: `${environment.apiUrl}`,
        withCredentials: true
      })
    }
  ]
};
