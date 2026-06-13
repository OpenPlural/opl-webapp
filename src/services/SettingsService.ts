import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import {fromJson, toJson} from '../util/FixedJson';
import { format } from 'date-fns';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { hookOnDataDeletion } from '../util/LocalDataDeletion';

@Injectable({providedIn: 'root'})
export class SettingsService {
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly storage: WritableSignal<Settings>;

  readonly settings: Signal<Settings>;
  readonly ready = computed(() => this.storage() !== null);

  constructor() {
    const storage = localStorage.getItem("settings");
    let settings: Settings;
    if (storage) {
      settings = fromJson(storage);
    } else {
      settings = makeDefaultSettings();
    }
    this.storage = signal(settings);
    this.settings = this.storage.asReadonly();
    this.translateService.use(settings.language);
    if (settings.defaultRoute !== '') {
      this.router.navigate(['app', settings.defaultRoute]);
    }

    hookOnDataDeletion(async () => {
      this.storage.set(makeDefaultSettings());
    });
  }

  private insertDefaultSettings(settings: any) {
    const defaults = makeDefaultSettings();
    for (const key in defaults) {
      if (!(key in settings)) {
        settings[key] = defaults[key as keyof Settings];
      }
    }
  }

  formatDate(date: Date, type: 'Date' | 'DateTime'): string {
    const settings = this.storage();
    switch (type) {
      case 'Date':
        return format(new Date(date), settings.dateFormat);
      case 'DateTime':
        return format(new Date(date), settings.dateFormat + " HH:mm");
    }
  }

  changeLanguage(id: string) {
    this.translateService.use(id);
    this.changeSettings(settings => settings.language = id);
  }

  changeStringSetting(name: keyof Settings, value: string) {
    this.changeSettings(settings => {
      // @ts-ignore
      settings[name] = value;
    });
  }

  changeBooleanSetting(name: keyof Settings, state: boolean) {
    this.changeSettings(settings => {
      // @ts-ignore
      settings[name] = state;
    });
  }

  private changeSettings(updater: (settings: Settings) => void) {
    this.storage.update((settings) => {
      const updatedSettings = Object.assign({}, settings);
      updater(updatedSettings);
      return updatedSettings;
    });
    localStorage.setItem("settings", toJson(this.storage()));
  }
}

export interface Settings {
  language: string;
  dateFormat: string;
  defaultRoute: string;
  loadAvatars: boolean;
  useNativeColorPicker: boolean;
  showSyncToast: boolean;
  hideRootMembers: boolean;
}

function makeDefaultSettings(): Settings {
  return {
    language: 'en',
    dateFormat: 'yyyy-MM-dd',
    defaultRoute: '',
    loadAvatars: true,
    useNativeColorPicker: false,
    showSyncToast: false,
    hideRootMembers: false,
  }
}
