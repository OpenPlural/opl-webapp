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

@Component({
  selector: 'app-member-folder-view',
  imports: [FolderListItem, IconButton, MemberListItem, ToggleIconButton, PopupInput],
  templateUrl: './member-folder-view.html',
  styleUrl: './member-folder-view.css',
})
export class MemberFolderView implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);

  readonly members = input.required<Member[]>();
  readonly folders = input.required<Folder[]>();
  readonly searchQuery = input.required<string | null>();
  readonly archived = input.required<boolean>();
  readonly editable = input.required<boolean>();
  readonly custom = input.required<boolean>();
  readonly friendId = input.required<UserId | null>();
  readonly selectMember = output<MemberId>();

  private readonly folderRoot = toSignal<string>(this.translate.get('folder root'), {
    initialValue: null,
  });
  protected readonly showFolders = signal(true);
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
    return allMembers.sort((a, b) => a.name.localeCompare(b.name));
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
      return allFolders.sort((a, b) => a.name.localeCompare(b.name));
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
    if (rememberedPath !== null) {
      this.currentFolder.set(rememberedPath == 0n ? null : rememberedPath);
    } else if (friendId) {
      rememberFriendPath(friendId, 0n);
    } else {
      rememberLocalPath(0n);
    }
  }

  protected toggleShowFolders() {
    this.showFolders.update((b) => !b);
  }

  protected gotoParentFolder() {
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

  protected readonly openDialog = openDialog;
}
