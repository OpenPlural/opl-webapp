import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountService } from '../../services/AccountService';
import { WebService } from '../../services/WebService';
import { HttpErrorResponse } from '@angular/common/http';
import { SyncService } from '../../services/SyncService';

@Component({
  selector: 'app-register',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './register.html',
})
export class Register {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  protected readonly errorMessage = signal<string | null>(null);

  protected goToLogin() {
    this.router.navigate(['auth', 'login']);
  }

  protected async register(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();
    const system = formData.get('system')?.toString();

    if (username && password && confirmPassword) {
      if (password !== confirmPassword) {
        const passwordConfirmationInput = document.getElementById("passwordConfirmation") as HTMLInputElement;
        passwordConfirmationInput.value = "";
        passwordConfirmationInput.parentElement!.className += " input-error";
        return;
      }
      try {
        await this.webService.register(username, password, system === 'on');
        await this.accountService.login(username, password);
        await this.syncService.fullSync();
      } catch (e) {
        if (e instanceof HttpErrorResponse) {
          const response = e.error;
          if (response && response.message) {
            this.errorMessage.set(response.message);
            return;
          }
        }
        console.error('Login failed:', e);
        return;
      }
      this.router.navigate(['app', 'setup']);
    }
  }
}
