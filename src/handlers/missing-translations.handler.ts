import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';
import { Injectable } from '@angular/core';

@Injectable()
export class LoggingMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    console.warn(`Missing translation for ${params.key}`);

    return `???${params.key}???`;
  }
}
