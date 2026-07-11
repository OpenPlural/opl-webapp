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
import { LoggingMissingTranslationHandler } from '../handlers/missing-translations.handler';
import {jsonHttpInterceptor} from '../handlers/json-parser.interceptor.handler';
import {authenticatedInterceptor} from '../handlers/authenticator.interceptor.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authenticatedInterceptor, jsonHttpInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n-v2/',
        suffix: '.json',
      }),
      compiler: provideTranslateCompiler(TranslateMessageFormatCompiler),
      missingTranslationHandler: provideMissingTranslationHandler(LoggingMissingTranslationHandler),
    }),
    provideServiceWorker('ext-sw.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
      updateViaCache: 'none',
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
  }, {
    id: 'de',
    name: 'Deutsch'
  }, {
    id: 'sr-Latn',
    name: 'Srpski (Latinica)'
  }, {
    id: 'sr-Cyrl',
    name: 'Српски (Ћирилица)'
  }
];

export function getLanguages(): {id: string, name: string}[] {
  return languages.filter((l) => !l.predicate || l.predicate());
}
