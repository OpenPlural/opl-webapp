import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {ErrorService} from '../../services/ErrorService';
import {WebService} from '../../services/WebService';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly router = inject(Router);
  private readonly errorService = inject(ErrorService);
  private readonly webService = inject(WebService);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);

  protected goToLogin() {
    this.router.navigate(['auth', 'login']);
  }

  protected async resetPassword(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get('username')?.toString();
    const resetToken = formData.get('resetToken')?.toString();
    const newPassword = formData.get('newPassword')?.toString();

    if (username && resetToken && newPassword) {
      this.loading.set(true);
      try {
        await this.webService.resetPassword(username, resetToken, newPassword);
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
