import { Component, computed, inject, signal } from '@angular/core';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { AccountService } from '../../../services/AccountService';
import { Loading } from '../../../components/loading/loading';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { TranslatePipe } from '@ngx-translate/core';
import { WebService } from '../../../services/WebService';
import { PopupInput } from '../../../components/popup-input/popup-input';
import { ProfilePicture } from '../../../components/profile-picture/profile-picture';
import { toColor } from '../../../util/ColorConvert';
import { nullableField } from '../../../util/NullString';
import { UserInfo } from '../../../services/model/User';
import { ToggleSetting } from '../../../components/toggle-setting/toggle-setting';
import { SettingsService } from '../../../services/SettingsService';
import { deleteLocalData } from '../../../util/LocalDataDeletion';
import { openDialog } from '../../../util/CommonFunctions';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ColorInput } from '../../../components/color-input/color-input';
import {MarkdownBox} from '../../../components/markdown-box/markdown-box';

@Component({
  selector: 'app-account-settings',
  imports: [
    EditPageContainer,
    Loading,
    PopupConfirm,
    TranslatePipe,
    PopupInput,
    ProfilePicture,
    ToggleSetting,
    ColorInput,
    MarkdownBox,
  ],
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  protected readonly account = computed(() => this.accountService.account());
  protected readonly accountCreationDate = computed(() => {
    const account = this.account();
    if (account) {
      return this.settingsService.formatDate(Date.parse(account.createdAt), 'DateTime');
    }
    return null;
  });
  protected readonly memberCounts = computed(() => {
    const members = this.localStorageService
      .members()
      .filter((m) => !m.custom);
    const count = members.filter((m) => !m.archived).length;
    const archivedCount = members.filter((m) => m.archived).length;
    return { count, archivedCount };
  });

  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly description = signal<string>('');
  protected readonly color = signal<bigint | null>(null);
  protected readonly updatedAccount = signal<UserInfo | null>(null);
  protected readonly showCreationDate = signal<boolean>(false);
  protected readonly showTotalMemberCount = signal<boolean>(false);
  protected readonly showFriendCode = signal<boolean>(false);
  protected readonly accountError = signal<string | null>(null);

  protected onUpdate() {
    const account = this.account();
    if (!account) return;

    const form = document.getElementById('accountForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();

    if (name && name.length > 0) {
      const updated = Object.assign({}, account.user);
      updated.name = name;
      updated.email = nullableField(email);

      const newDescription = this.description();
      updated.description = nullableField(newDescription);

      const newColor = this.color();
      if (newColor != null) {
        updated.color = newColor;
      }

      const newAvatar = this.avatarUrl();
      if (newAvatar != null) {
        updated.avatar = nullableField(newAvatar);
      }

      this.updatedAccount.set(updated);
    }
  }

  protected setSystem(state: boolean) {
    this.updatedAccount.update((user) => {
      if (!user) {
        user = this.account()?.user || null;
      }
      if (user) {
        const updated = Object.assign({}, user);
        updated.system = state;
        return updated;
      }
      return user;
    });
  }

  protected async editAvatar(url: string) {
    this.avatarUrl.set(url);
    this.onUpdate();
  }

  protected descriptionChanged(description: string) {
    this.description.set(description);
    this.onUpdate();
  }

  protected colorSelected(color: bigint) {
    this.color.set(color);
    this.onUpdate();
  }

  protected async save() {
    const updatedUser = this.updatedAccount();
    if (updatedUser) {
      await this.webService.updateUser(updatedUser);
      this.accountService.updateAccountLocally(updatedUser);
    }
    this.location.back();
  }

  protected async changeFriendCode() {
    const newFriendCode = await this.webService.changeFriendCode();
    this.accountService.updateFriendCodeLocally(newFriendCode);
  }

  protected async deleteAccount(password: string) {
    const account = this.account();
    if (!account) return;

    try {
      await this.webService.deleteAccount(account.user.id, password);
    } catch (e) {
      console.error('Failed to delete account', e);
      this.accountError.set('delete account failed');
      openDialog('accountError');
      return;
    }
    await deleteLocalData(this.accountService, this.localStorageService, this.router);
  }

  protected async changePassword(event: SubmitEvent) {
    const account = this.account();
    if (!account) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const oldPassword = formData.get('oldPassword')?.toString();
    const newPassword = formData.get('newPassword')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    if (oldPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        const passwordConfirmationInput = document.getElementById(
          'passwordConfirmation',
        ) as HTMLInputElement;
        passwordConfirmationInput.value = '';
        passwordConfirmationInput.className += ' input-error';
        event.preventDefault();
        return;
      }
      try {
        await this.webService.changePassword(account.user.id, oldPassword, newPassword);
      } catch (e) {
        console.error('Failed to change password', e);
        this.accountError.set('change password failed');
        openDialog('accountError');
      }
    }

    form.reset();
  }

  protected async resetPasswordDialog() {
    const passwordConfirmationInput = document.getElementById(
      'passwordConfirmation',
    ) as HTMLInputElement;
    passwordConfirmationInput.className = passwordConfirmationInput.className.replace(
      ' input-error',
      '',
    );

    const form = document.getElementById('changePasswordForm') as HTMLFormElement;
    form.reset();
  }

  protected readonly toColor = toColor;
  protected readonly openDialog = openDialog;
}
