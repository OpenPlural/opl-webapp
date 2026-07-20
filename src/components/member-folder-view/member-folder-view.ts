import {Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import { Folder, FolderId, makeFolder } from '../../services/model/Folder';
import { FolderListItem } from '../list-item/folder-list-item/folder-list-item';
import { IconButton } from '../icon-button/icon-button';
import { MemberListItem } from '../list-item/member-list-item/member-list-item';
import { ToggleIconButton } from '../toggle-icon-button/toggle-icon-button';
import { LocalStorageService } from '../../services/LocalStorageService';
import { makeMember, Member, MemberId } from '../../services/model/Member';
import { PopupInput } from '../popup-input/popup-input';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SettingsService } from '../../services/SettingsService';
import { openDialog } from '../../util/CommonFunctions';
import {UserId} from '../../services/model/User';
import {
  getRememberedFriendPath,
  getRememberedLocalPath,
  rememberFriendPath,
  rememberLocalPath
} from '../../util/RememberPath';
import {compareCustomSort} from '../../util/CustomSort';
import { MemberSelector } from '../selector/member-selector/member-selector';
import { truncateCurrentDate } from '../../util/DateTruncate';
import { SyncService } from '../../services/SyncService';

@Component({
  selector: 'app-member-folder-view',
  imports: [
    FolderListItem,
    IconButton,
    MemberListItem,
    ToggleIconButton,
    PopupInput,
    MemberSelector,
  ],
  templateUrl: './member-folder-view.html',
  styleUrl: './member-folder-view.css',
})
export class MemberFolderView implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly syncService = inject(SyncService);

  readonly members = input.required<Member[]>();
  readonly folders = input.required<Folder[]>();
  readonly searchQuery = input.required<string | null>();
  readonly archived = input.required<boolean>();
  readonly editable = input.required<boolean>();
  readonly custom = input.required<boolean>();
  readonly friendId = input.required<UserId | null>();
  readonly selectMember = output<MemberId>();

  private readonly folderRoot = toSignal<string>(this.translate.get('folders.labels.root'), {
    initialValue: null,
  });
  protected readonly showFolders = signal(true);
  protected readonly assignMembers = signal(false);
  protected readonly folderMembers = computed(() => {
    const currentFolder = this.currentFolder();
    if (currentFolder) {
      return this.members()
        .filter((member) => member.folders.indexOf(currentFolder) !== -1)
        .map((member) => member.id);
    }
    return [];
  });
  protected readonly currentPath = computed(() => {
    const currentFolder = this.currentFolder();
    if (currentFolder) {
      const folders = this.folders();
      const path: string[] = [];
      let lastFolder = folders.find((folder) => folder.id === currentFolder);
      while (lastFolder) {
        path.push((lastFolder.emoji || '') + ' ' + lastFolder.name);
        lastFolder = folders.find((folder) => folder.id === lastFolder!.parentId);
      }
      return this.folderRoot() + ' / ' + path.reverse().join(' / ');
    }
    return this.folderRoot();
  });
  protected readonly currentFolder = signal<FolderId | null>(null);
  protected readonly shownMembers = computed(() => {
    let allMembers = this.members();
    if (!this.archived()) {
      allMembers = allMembers.filter((member) => !member.archived);
    }

    const searchQuery = this.searchQuery();
    if (searchQuery) {
      allMembers = allMembers.filter(
        (member) => member.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1,
      );
    }
    if (this.showFolders()) {
      const currentFolder = this.currentFolder();
      if (currentFolder) {
        allMembers = allMembers.filter((member) => member.folders.indexOf(currentFolder) !== -1);
      } else if (this.settingsService.settings().hideRootMembers) {
        allMembers = allMembers.filter((member) => member.folders.length === 0);
      }
    }
    return allMembers.sort(compareCustomSort);
  });
  protected readonly shownFolders = computed(() => {
    if (this.showFolders()) {
      let allFolders = this.folders();
      if (!allFolders) {
        return [];
      }
      const searchQuery = this.searchQuery();
      if (searchQuery) {
        allFolders = allFolders.filter(
          (folder) => folder.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1,
        );
      }
      const currentFolder = this.currentFolder();
      if (currentFolder) {
        allFolders = allFolders.filter((folder) => folder.parentId === currentFolder);
      } else {
        allFolders = allFolders.filter((folder) => !folder.parentId);
      }
      return allFolders.sort(compareCustomSort);
    } else {
      return [];
    }
  });

  ngOnInit() {
    if (this.custom()) return;

    const friendId = this.friendId();
    let rememberedPath: FolderId | null;
    if (friendId) {
      rememberedPath = getRememberedFriendPath(friendId);
    } else {
      rememberedPath = getRememberedLocalPath();
    }
    if (
      rememberedPath !== null &&
      (rememberedPath === 0n || this.folders().find((folder) => folder.id === rememberedPath))
    ) {
      this.currentFolder.set(rememberedPath === 0n ? null : rememberedPath);
    } else if (friendId) {
      rememberFriendPath(friendId, 0n);
    } else {
      rememberLocalPath(0n);
    }
  }

  protected toggleShowFolders() {
    this.assignMembers.set(false);
    this.showFolders.update((b) => !b);
  }

  protected gotoParentFolder() {
    this.assignMembers.set(false);
    this.currentFolder.update((folderId) => {
      if (folderId) {
        const currentFolder = this.folders().find((folder) => folder.id === folderId);
        if (currentFolder) {
          const nextFolderId = currentFolder.parentId || null;
          this.rememberCurrentFolder(nextFolderId);
          return nextFolderId;
        }
      }
      this.rememberCurrentFolder(null);
      return null;
    });
  }

  protected changeCurrentFolder(folderId: FolderId | null) {
    this.assignMembers.set(false);
    this.currentFolder.set(folderId);
    this.rememberCurrentFolder(folderId);
  }

  private rememberCurrentFolder(folderId: FolderId | null) {
    const friendId = this.friendId();
    if (friendId) {
      rememberFriendPath(friendId, folderId || 0n);
    } else {
      rememberLocalPath(folderId || 0n);
    }
  }

  protected async createMember(name: string) {
    if (name.length === 0) {
      return;
    }
    const member = makeMember(name, this.custom());
    await this.localStorageService.addMember(member);
    this.router.navigate(['app', 'member', member.id]);
  }

  protected async createFolder(name: string) {
    if (name.length === 0) {
      return;
    }
    const folder = makeFolder(name, this.currentFolder());
    await this.localStorageService.addFolder(folder);
    this.router.navigate(['app', 'folder', folder.id]);
  }

  protected editFolder() {
    const currentFolder = this.currentFolder();
    if (currentFolder) {
      this.router.navigate(['app', 'folder', currentFolder]);
    }
  }

  protected async assignFolderMembers(selection: MemberId[]) {
    const currentFolder = this.currentFolder();
    if (!currentFolder) return;

    const time = truncateCurrentDate();

    const currentFolderMembers = this.folderMembers();
    const addMembers = selection.filter((id) => !currentFolderMembers.includes(id));
    const removeMembers = currentFolderMembers.filter((id) => !selection.includes(id));

    for (const memberId of addMembers) {
      const member = this.members().find((member) => member.id === memberId);
      if (member) {
        await this.localStorageService.updateMember({
          ...member,
          folders: [...member.folders, currentFolder],
          updatedAt: time,
        });
      }
    }

    for (const memberId of removeMembers) {
      const member = this.members().find((member) => member.id === memberId);
      if (member) {
        await this.localStorageService.updateMember({
          ...member,
          folders: member.folders.filter((id) => id !== currentFolder),
          updatedAt: time,
        });
      }
    }

    this.assignMembers.set(false);

    this.syncService.fullSync();
  }

  protected readonly openDialog = openDialog;
}
