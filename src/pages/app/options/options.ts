import { Component, computed, inject, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { TranslatePipe } from '@ngx-translate/core';
import { appRoutes } from '../../../app/app.routes';
import {Settings, SettingsService} from '../../../services/SettingsService';
import { ToggleSetting } from '../../../components/toggle-setting/toggle-setting';
import { getLanguages } from '../../../app/app.config';
import {PushService} from '../../../services/PushService';
import {AccountService} from '../../../services/AccountService';

@Component({
  selector: 'app-options',
  imports: [NavPageContainer, TranslatePipe, ToggleSetting],
  templateUrl: './options.html',
})
export class Options {
  private readonly accountService = inject(AccountService);
  private readonly pushService = inject(PushService);
  private readonly settingsService = inject(SettingsService);

  protected readonly selectedTheme = signal<string>('');

  protected readonly settings = computed(() => this.settingsService.settings());

  protected readonly appRoutes = computed(() => {
    const system = this.accountService.account()?.user.system;
    return appRoutes.filter((route) => {
      if (route.data && route.data['name']) {
        if (route.data['navigable']) {
          return true;
        }
        if (system && route.data['systemNavigable']) {
          return true;
        }
      }
      return false;
    });
  });

  constructor() {
    const theme = localStorage.getItem('theme');
    this.selectedTheme.set(theme || 'dim');
  }

  protected updateDefaultPage(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.settingsService.changeStringSetting('defaultRoute', select.value);
  }

  protected updateLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.settingsService.changeLanguage(select.value);
  }

  protected updateTheme(event: Event) {
    const select = event.target as HTMLSelectElement;
    localStorage.setItem('theme', select.value);
    document.body.setAttribute('data-theme', select.value);
  }

  protected updateDateFormat(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.settingsService.changeStringSetting('dateFormat', select.value);
  }

  protected toggleSetting(name: keyof Settings, state: boolean) {
    this.settingsService.changeBooleanSetting(name, state);
  }

  protected requestNotificationPermissions() {
    this.pushService.requestPermissions();
  }

  protected getThemeName(theme: string): string {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  protected readonly getLanguages = getLanguages;
  protected readonly Notification = Notification;
  protected readonly THEMES = THEMES;
}

const THEMES = [
  'abyss', 'aqua', 'business', 'dark', 'dim', 'dracula', 'halloween', 'night', 'sunset', 'synthwave',
  null,
  'corporate', 'emerald', 'fantasy', 'garden', 'retro'
];
