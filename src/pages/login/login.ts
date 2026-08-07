import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountService } from '../../services/AccountService';
import { HttpErrorResponse } from '@angular/common/http';
import { SyncService } from '../../services/SyncService';
import {LegalFooter} from '../../components/legal-footer/legal-footer';
import {ErrorService} from '../../services/ErrorService';
import {LocalStorageService} from '../../services/LocalStorageService';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TranslatePipe, LegalFooter],
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);

  protected goToRegister() {
    this.router.navigate(['auth', 'register']);
  }

  protected goToPasswordReset() {
    this.router.navigate(['auth', 'reset-password']);
  }

  protected async login(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    if (username && password) {
      this.loading.set(true);
      try {
        if (username === '__VIRTUAL' && password === '__VIRTUAL') {
          const virtualSessionToken = prompt("Please enter your virtual session token:");
          if (virtualSessionToken) {
            await this.accountService.initVirtualSession(virtualSessionToken);
            this.localStorageService.markDirty();
            await this.syncService.fullSync(true);
          }
          return;
        }
        await this.accountService.login(username, password);
        this.localStorageService.markDirty();
        await this.syncService.fullSync(true);
      } catch (e) {
        this.errorService.logError(e);
        if (e instanceof HttpErrorResponse) {
          const response = e.error;
          if (response && response.message) {
            this.errorMessage.set(response.message);
          }
        }
        return;
      } finally {
        this.loading.set(false);
      }
      this.router.navigate(['app']);
    }
  }
}
