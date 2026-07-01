import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import {fromJson, toJson} from '../util/FixedJson';
import { format } from 'date-fns';
import {TranslateService} from '@ngx-translate/core';
import { Router } from '@angular/router';
import { hookOnDataDeletion } from '../util/LocalDataDeletion';
import {toSignal} from '@angular/core/rxjs-interop';
import {UTCDate} from '@date-fns/utc';

@Injectable({providedIn: 'root'})
export class SettingsService {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly timeAm = toSignal<string>(this.translate.getStreamOnTranslationChange('format.time.am'), {
    initialValue: null,
  });
  private readonly timePm = toSignal<string>(this.translate.getStreamOnTranslationChange('format.time.pm'), {
    initialValue: null,
  });

  private readonly storage: WritableSignal<Settings>;

  readonly settings: Signal<Settings>;
  readonly ready = computed(() => this.storage() !== null);

  constructor() {
    const storage = localStorage.getItem("settings");
    let settings: Settings;
    if (storage) {
      settings = fromJson(storage);
      this.insertDefaultSettings(settings);
    } else {
      settings = makeDefaultSettings();
    }
    this.storage = signal(settings);
    this.settings = this.storage.asReadonly();
    this.translate.use(settings.language);
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

  private formatDateWithTimezone(timestamp: number, dateFormat: string, type: 'Date' | 'DateTime'): string {
    const date = new Date(timestamp);
    const formattedDate = format(date, dateFormat);
    if (type === 'DateTime') {
      return formattedDate + " " + this.formatTimeFromValues(date.getHours(), date.getMinutes());
    } else {
      return formattedDate;
    }
  }

  private formatDateWithoutTimezone(timestamp: number, dateFormat: string, type: 'Date' | 'DateTime'): string {
    const date = new UTCDate(timestamp);
    const formattedDate = format(date, dateFormat);
    if (type === 'DateTime') {
      const date = new Date(timestamp);
      return formattedDate + " " + this.formatTimeFromValues(date.getUTCHours(), date.getUTCMinutes());
    } else {
      return formattedDate;
    }
  }

  formatDate(timestamp: number, type: 'Date' | 'DateTime', parseTimezone: boolean = true): string {
    const settings = this.storage();

    if (parseTimezone) {
      return this.formatDateWithTimezone(timestamp, settings.dateFormat, type);
    } else {
      return this.formatDateWithoutTimezone(timestamp, settings.dateFormat, type);
    }
  }

  formatTime(time: string): string {
    const parts = time.split(':');
    if (parts.length !== 2) {
      return time;
    }

    const hour = parseInt(parts[0]);
    const minute = parseInt(parts[1]);

    return this.formatTimeFromValues(hour, minute);
  }

  formatTimeFromValues(hour: number, minute: number): string {
    const settings = this.storage();
    if (settings.time24Hours) {
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    } else if (hour === 0) {
      return `12:${minute.toString().padStart(2, "0")} ${this.timeAm()}`;
    } else if (hour >= 1 && hour < 12) {
      return `${hour}:${minute.toString().padStart(2, "0")} ${this.timeAm()}`;
    } else if (hour === 12) {
      return `12:${minute.toString().padStart(2, "0")} ${this.timePm()}`;
    } else if (hour >= 13 && hour < 24) {
      return `${hour - 12}:${minute.toString().padStart(2, "0")} ${this.timePm()}`;
    } else {
      // Fallback to 24 hour time
      return `${hour}:${minute}`;
    }
  }

  changeLanguage(id: string) {
    this.translate.use(id);
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
  time24Hours: boolean;
  defaultRoute: string;
  loadAvatars: boolean;
  useNativeColorPicker: boolean;
  showSyncToast: boolean;
  useNavMenu: boolean;
  customSortEditor: boolean;
  hideRootMembers: boolean;
  currentFrontNotify: boolean;
}

function makeDefaultSettings(): Settings {
  return {
    language: 'en',
    dateFormat: 'yyyy-MM-dd',
    time24Hours: true,
    defaultRoute: '',
    loadAvatars: true,
    useNativeColorPicker: false,
    showSyncToast: false,
    useNavMenu: true,
    customSortEditor: false,
    hideRootMembers: false,
    currentFrontNotify: false,
  }
}
