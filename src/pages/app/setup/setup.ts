import {Component, inject, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {AccountService} from '../../../services/AccountService';
import {WebService} from '../../../services/WebService';

@Component({
  selector: 'app-setup',
  imports: [
    TranslatePipe
  ],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
})
export class Setup {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly webService = inject(WebService);

  protected readonly email = signal('');

  protected async continueWithEmail() {
    const account = this.accountService.account();
    if (account) {
      const updatedUserInfo = {
        ...account.user,
        email: this.email().trim(),
      };
      await this.webService.updateUser(updatedUserInfo);
      this.accountService.updateAccountLocally(updatedUserInfo);
      this.router.navigate(['app']);
    }
  }

  protected async continueWithoutEmail() {
    this.router.navigate(['app']);
  }

  protected updateEmail(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    this.email.set(input.value);
  }

  protected hasEmail(): boolean {
    const email = this.email();
    return email.includes('@') && email.includes('.');
  }
}
