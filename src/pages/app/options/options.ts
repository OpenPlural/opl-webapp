import { Component, computed, inject } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { TranslatePipe } from '@ngx-translate/core';
import { appRoutes } from '../../../app/app.routes';
import { Route } from '@angular/router';
import {Settings, SettingsService} from '../../../services/SettingsService';
import { ToggleSetting } from '../../../components/toggle-setting/toggle-setting';
import { getLanguages } from '../../../app/app.config';
import {NotificationService} from '../../../services/NotificationService';

@Component({
  selector: 'app-options',
  imports: [NavPageContainer, TranslatePipe, ToggleSetting],
  templateUrl: './options.html',
})
export class Options {
  private readonly notificationService = inject(NotificationService);
  private readonly settingsService = inject(SettingsService);

  protected readonly settings = computed(() => this.settingsService.settings());

  protected getAppRoutes(): Route[] {
    return appRoutes.filter((route) => route.data && route.data['name'] && route.data['navigable']);
  }

  protected updateDefaultPage(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.settingsService.changeStringSetting('defaultRoute', select.value);
  }

  protected updateLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.settingsService.changeLanguage(select.value);
  }

  protected updateDateFormat(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.settingsService.changeStringSetting('dateFormat', select.value);
  }

  protected toggleSetting(name: keyof Settings, state: boolean) {
    this.settingsService.changeBooleanSetting(name, state);
  }

  protected requestNotificationPermissions() {
    this.notificationService.requestPermissions();
  }

  protected readonly getLanguages = getLanguages;
  protected readonly Notification = Notification;
}
