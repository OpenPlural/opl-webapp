import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  // @ts-ignore
  return JSON.rawJSON(this.toString());
};

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
