import {Component, computed, inject, signal} from '@angular/core';
import {FolderListItem} from '../../../components/list-item/folder-list-item/folder-list-item';
import {MemberListItem} from '../../../components/list-item/member-list-item/member-list-item';
import {LocalStorageService} from '../../../services/LocalStorageService';
import {Folder, FolderId} from '../../../services/model/Folder';
import {Member, MemberId} from '../../../services/model/Member';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {TranslatePipe} from '@ngx-translate/core';
import {PopupConfirm} from '../../../components/popup-confirm/popup-confirm';
import {openDialog} from '../../../util/CommonFunctions';
import {SyncService} from '../../../services/SyncService';

@Component({
  selector: 'app-mass-delete',
  imports: [
    FolderListItem,
    MemberListItem,
    NavPageContainer,
    TranslatePipe,
    PopupConfirm
  ],
  templateUrl: './mass-delete.html',
})
export class MassDelete {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  protected readonly selectedFolders = signal<Folder[]>([]);
  protected readonly selectedMembers = signal<Member[]>([]);
  protected readonly selectAll = signal<boolean>(false);

  protected readonly folders = computed(() => this.localStorageService.folders());
  protected readonly members = computed(() => this.localStorageService.members());
  protected readonly selectedFolderCount = computed(() => this.selectedFolders().length);
  protected readonly selectedMemberCount = computed(() => this.selectedMembers().length)

  protected setFolderSelected(folder: Folder, selected: boolean) {
    this.selectedFolders.update((sel) => {
      if (selected) {
        return [...sel, folder];
      } else {
        return sel.filter((f) => f.id !== folder.id);
      }
    });
  }

  protected setMemberSelected(member: Member, selected: boolean) {
    this.selectedMembers.update((sel) => {
      if (selected) {
        return [...sel, member];
      } else {
        return sel.filter((m) => m.id !== member.id);
      }
    });
  }

  protected toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.selectAll.set(checkbox.checked);

    if (checkbox.checked) {
      this.selectedFolders.set(this.folders());
      this.selectedMembers.set(this.members());
    } else {
      this.selectedFolders.set([]);
      this.selectedMembers.set([]);
    }
  }

  protected async deleteSelected() {
    const foldersToDelete = this.selectedFolders();
    for (const folder of foldersToDelete) {
      await this.localStorageService.removeFolder(folder.id, folder.remoteId);
    }

    const membersToDelete = this.selectedMembers();
    for (const member of membersToDelete) {
      await this.localStorageService.removeMember(member.id, member.remoteId);
    }

    this.selectedFolders.set([]);
    this.selectedMembers.set([]);

    this.syncService.fullSync();
  }

  protected readonly openDialog = openDialog;
}
