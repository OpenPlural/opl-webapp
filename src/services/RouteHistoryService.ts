import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Injectable({providedIn: 'root'})
export class RouteHistoryService {
  private readonly router = inject(Router);

  private previousUrl: string | null = null;
  private currentUrl: string | null = null;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      }
    });
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }
}
