import {Component, inject, OnInit, signal} from '@angular/core';
import {WebService} from '../../../services/WebService';
import {ApiKey, ApiKeyId} from '../../../services/model/ApiKey';
import {TranslatePipe} from '@ngx-translate/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {openDialog} from '../../../util/CommonFunctions';
import {Loading} from '../../../components/loading/loading';
import {SettingsService} from '../../../services/SettingsService';
import {IconButton} from '../../../components/icon-button/icon-button';
import {VerticalCenter} from '../../../components/vertical-center/vertical-center';

@Component({
  selector: 'app-api-keys',
  imports: [
    TranslatePipe,
    NavPageContainer,
    Loading,
    IconButton,
    VerticalCenter
  ],
  templateUrl: './api-keys.html',
})
export class ApiKeys implements OnInit{
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  protected readonly apiKeys = signal<ApiKey[] | null>(null);
  protected readonly apiKeyName = signal<string | undefined>(undefined);
  protected readonly apiKeyToken = signal<string | undefined>(undefined);
  protected readonly apiKeyCopied = signal<boolean>(false);

  ngOnInit() {
    this.loadApiKeys();
  }

  private async loadApiKeys() {
    const apiKeys = await this.webService.getApiKeys();
    this.apiKeys.set(apiKeys.sort((a, b) => a.name.localeCompare(b.name)));
  }

  protected async createApiKey(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim();
    const write = formData.get('write')?.toString() === 'on';
    form.reset();

    if (name) {
      const apiKey = await this.webService.createApiKey(name, write);
      this.apiKeyName.set(apiKey.name);
      this.apiKeyToken.set(apiKey.token);
      this.apiKeys.update((keys) => {
        if (keys) {
          return [...keys, apiKey].sort((a: ApiKey, b: ApiKey) => a.name.localeCompare(b.name));
        }
        return [apiKey];
      });
      this.loadApiKeys();
      openDialog('apiKeyTokenPopup');
    }
  }

  protected async deleteApiKey(id: ApiKeyId) {
    await this.webService.deleteApiKey(id);
    this.apiKeys.update((keys) => keys?.filter(key => key.id !== id) || null);
  }

  protected unloadCreatedApiKey() {
    this.apiKeyName.set(undefined);
    this.apiKeyToken.set(undefined);
  }

  protected async copyCreatedApiKey() {
    const input = document.getElementById('createdApiKeyToken') as HTMLInputElement;
    input.select();
    input.setSelectionRange(0, 99999);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(input.value);
      this.apiKeyCopied.set(true);
      setTimeout(() => {
        this.apiKeyCopied.set(false);
      }, 500);
    }
  }

  protected formatDate(date: string): string {
    return this.settingsService.formatDate(Date.parse(date), 'DateTime');
  }

  protected readonly openDialog = openDialog;
}
