import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { REALTIME_CONFIG } from '@bugflow-2026/realtime';
import { API_CONFIG } from 'data-access/src/lib/api-config.token';
import { appRoutes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor/error.interceptor-interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0.audience,
        scope: 'openid profile email read:messages',
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
      useRefreshTokensFallback: false,
    }),
    provideHttpClient(withInterceptors([
      authInterceptor,
      errorInterceptor,
    ])),
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.apiUrl,
      },
    },
    {
      provide: REALTIME_CONFIG,
      useValue: {
        socketUrl: environment.socketUrl,
      },
    },
  ],
};
