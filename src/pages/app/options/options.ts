import { AfterViewInit, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { TranslatePipe } from '@ngx-translate/core';
import { appRoutes } from '../../../app/app.routes';
import {Settings, SettingsService} from '../../../services/SettingsService';
import { ToggleSetting } from '../../../components/toggle-setting/toggle-setting';
import { getLanguages } from '../../../app/app.config';
import {PushService} from '../../../services/PushService';
import {NativeService} from '../../../services/NativeService';
import {AccountService} from '../../../services/AccountService';

@Component({
  selector: 'app-options',
  imports: [NavPageContainer, TranslatePipe, ToggleSetting],
  templateUrl: './options.html',
})
export class Options implements AfterViewInit, OnDestroy {
  private readonly accountService = inject(AccountService);
  private readonly nativeService = inject(NativeService);
  private readonly pushService = inject(PushService);
  private readonly settingsService = inject(SettingsService);

  private timerId?: number;

  protected readonly selectedTheme = signal<string>('');
  protected readonly permissionStatus = signal<string>('default');

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

  ngAfterViewInit() {
    if (this.hasNotificationSupport()) {
      this.permissionStatus.set(this.checkNotificationPermissions());
      this.timerId = setInterval(() => {
        this.permissionStatus.set(this.checkNotificationPermissions());
      }, 1000);
    }
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
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

  protected isNativeApp() {
    return this.nativeService.isNativeApp();
  }

  protected hasNotificationSupport() {
    return this.isNativeApp() || 'Notification' in window;
  }

  protected checkNotificationPermissions(): string {
    return this.nativeService.checkNotificationPermissions() || Notification.permission;
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
