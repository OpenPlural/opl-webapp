import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ArcElement, Chart, DoughnutController } from 'chart.js';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  if ('rawJSON' in JSON && typeof JSON.rawJSON === 'function') {
    return JSON.rawJSON(this.toString());
  } else {
    return this.toString();
  }
};

Chart.register([DoughnutController, ArcElement]);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
