import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  if ('rawJSON' in JSON && typeof JSON.rawJSON === 'function') {
    return JSON.rawJSON(this.toString());
  } else {
    return this.toString();
  }
};

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
