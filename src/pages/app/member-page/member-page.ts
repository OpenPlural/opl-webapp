import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { Misrouted } from '../../../components/misrouted/misrouted';
import { TranslatePipe } from '@ngx-translate/core';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { Member } from '../../../services/model/Member';
import { MemberProfilePage } from '../member-profile-page/member-profile-page';
import { MemberOptionsPage } from '../member-options-page/member-options-page';
import { openDialog } from '../../../util/CommonFunctions';
import { CustomFieldDataUpdate, MemberCustomFieldsPage } from '../member-custom-fields-page/member-custom-fields-page';
import { FolderId } from '../../../services/model/Folder';
import { truncateCurrentDate } from '../../../util/DateTruncate';
import { MemberFrontHistoryPage } from '../member-front-history-page/member-front-history-page';

@Component({
  selector: 'app-member-page',
  imports: [
    EditPageContainer,
    Misrouted,
    TranslatePipe,
    PopupConfirm,
    Pager,
    ToggleIconButton,
    MemberProfilePage,
    MemberOptionsPage,
    MemberCustomFieldsPage,
    MemberFrontHistoryPage,
  ],
  templateUrl: './member-page.html',
  styleUrl: './member-page.css',
})
export class MemberPage {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  protected readonly selectedTab = signal<
    'profile' | 'custom fields' | 'message board' | 'front history' | 'notes' | 'options'
  >('profile');
  protected readonly updatedMemberProfile = signal<Member | null>(null);
  protected readonly updatedMemberFolders = signal<FolderId[] | null>(null);
  protected readonly editingCustomFieldData = signal<boolean>(false);
  protected readonly updatedCustomFieldData = signal<CustomFieldDataUpdate[] | null>(null);
  protected readonly updatedArchived = signal<boolean | null>(null);

  protected readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? BigInt(id) : null;
      }),
    ),
    { initialValue: null },
  );
  protected readonly member = computed(() => {
    const id = this.id();
    return this.localStorageService.members().find((m) => m.id === id);
  });
  protected readonly folders = computed(() => {
    const member = this.member();
    if (!member) return [];

    return this.localStorageService.folders().filter((f) => member.folders.includes(f.id));
  });
  protected readonly allFolders = computed(() => this.localStorageService.folders());

  protected async delete() {
    const member = this.member();
    if (!member) return;

    await this.localStorageService.removeMember(member.id, member.remoteId);
    this.syncService.fullSync();
    this.location.back();
  }

  protected async save() {
    if (this.editingCustomFieldData()) return;

    const member = this.member();
    if (!member) return;

    let updatedMember = this.updatedMemberProfile();
    if (!updatedMember && !member.remoteId) {
      updatedMember = member;
    }

    const updatedArchived = this.updatedArchived();
    if (updatedArchived !== null) {
      if (!updatedMember) {
        updatedMember = member;
      }
      updatedMember.archived = updatedArchived;
    }

    const folderUpdates = this.updatedMemberFolders();
    if (folderUpdates !== null) {
      if (!updatedMember) {
        updatedMember = member;
      }
      updatedMember.folders = folderUpdates;
      updatedMember.updatedAt = truncateCurrentDate();
    }

    let syncRequired = false;
    if (updatedMember) {
      await this.localStorageService.updateMember(updatedMember);
      syncRequired = true;
    }

    const fieldUpdates = this.updatedCustomFieldData();
    if (fieldUpdates !== null) {
      for (const { oldValue, newValue } of fieldUpdates) {
        if (newValue) {
          if (oldValue) {
            await this.localStorageService.updateCustomFieldValue(newValue);
          } else {
            await this.localStorageService.addCustomFieldValue(newValue);
          }
        } else if (oldValue) {
          await this.localStorageService.removeCustomFieldValue(oldValue.id, oldValue.remoteId);
        }
      }
      syncRequired = true;
    }

    if (syncRequired) {
      this.syncService.fullSync();
    }

    this.location.back();
  }

  protected readonly openDialog = openDialog;
}
