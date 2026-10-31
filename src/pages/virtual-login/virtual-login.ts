import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StagingWarning } from '../../components/staging-warning/staging-warning';
import { AccountService } from '../../services/AccountService';
import { LocalStorageService } from '../../services/LocalStorageService';
import { SyncService } from '../../services/SyncService';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorService } from '../../services/ErrorService';

@Component({
  selector: 'app-virtual-login',
  imports: [FormsModule, ReactiveFormsModule, StagingWarning, TranslatePipe],
  templateUrl: './virtual-login.html',
})
export class VirtualLogin {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  protected readonly loading = signal<boolean>(false);

  protected async virtualLogin(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const token = formData.get('token')?.toString();
    if (!token) {
      return;
    }

    this.loading.set(true);
    try {
      await this.accountService.initVirtualSession(token);
      this.localStorageService.markDirty();
      await this.syncService.fullSync(true);
    } catch (e) {
      this.errorService.logError(e);
      return;
    } finally {
      this.loading.set(false);
    }
    await this.router.navigate(['app']);
  }
}
