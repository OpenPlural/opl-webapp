import { Component, inject, input, output, signal } from '@angular/core';
import { PageContainer } from '../page-container/page-container';
import { appRoutes } from '../../../app/app.routes';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { ToggleIconButton } from '../../toggle-icon-button/toggle-icon-button';
import { WebService } from '../../../services/WebService';
import { AccountService } from '../../../services/AccountService';
import { deleteLocalData } from '../../../util/LocalDataDeletion';
import { PopupConfirm } from '../../popup-confirm/popup-confirm';
import { openDialog } from '../../../util/CommonFunctions';
import { LocalStorageService } from '../../../services/LocalStorageService';

@Component({
  selector: 'app-nav-page-container',
  imports: [PageContainer, TranslatePipe, ToggleIconButton, PopupConfirm],
  templateUrl: './nav-page-container.html',
})
export class NavPageContainer {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly webService = inject(WebService);

  protected readonly searching = signal(false);

  readonly footer = input<boolean>(false);
  readonly fab = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly search = output<string | null>();
  readonly fabAction = output();

  protected getCurrentRouteName(): string | null {
    const data = this.route.routeConfig?.data;
    if (!data) return null;

    const titleName = data['titleName'];
    if (titleName) {
      return titleName;
    }
    return data['name'];
  }

  protected getAppRoutes(): Route[] {
    return appRoutes.filter((route) => route.data && route.data['name'] && route.data['navigable']);
  }

  protected getRouteName(route: Route): string {
    return route.data!['name'];
  }

  protected gotoRoute(route: Route) {
    if (route.path === '') {
      this.router.navigate(['app']);
    } else {
      this.router.navigate(['app', route.path]);
    }
  }

  protected toggleSearch() {
    this.searching.update((b) => {
      if (b) {
        this.search.emit(null);
      }
      return !b;
    });
  }

  protected async logout() {
    await this.webService.invalidateCurrentSession();
    this.accountService.logout();
    await deleteLocalData(this.accountService, this.localStorageService, this.router);
  }

  protected readonly openDialog = openDialog;
}
