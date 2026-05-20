import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideMissingTranslationHandler,
  provideTranslateCompiler,
  provideTranslateService
} from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authenticatedInterceptor } from '../services/AccountService';
import { LoggingMissingTranslationHandler } from '../handlers/missing-translations.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authenticatedInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
      compiler: provideTranslateCompiler(TranslateMessageFormatCompiler),
      missingTranslationHandler: provideMissingTranslationHandler(LoggingMissingTranslationHandler),
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

const languages = [
  {
    id: 'dev-raw',
    name: 'Raw (Dev)',
    predicate: isDevMode,
  }, {
    id: 'en',
    name: 'English'
  }
];

export function getLanguages(): {id: string, name: string}[] {
  return languages.filter((l) => !l.predicate || l.predicate());
}
