import { Component, computed, inject, input, output, signal } from '@angular/core';
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

@Component({
  selector: 'app-member-folder-view',
  imports: [FolderListItem, IconButton, MemberListItem, ToggleIconButton, PopupInput],
  templateUrl: './member-folder-view.html',
  styleUrl: './member-folder-view.css',
})
export class MemberFolderView {
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

  protected toggleShowFolders() {
    this.showFolders.update((b) => !b);
  }

  protected gotoParentFolder() {
    this.currentFolder.update((folderId) => {
      if (folderId) {
        const currentFolder = this.folders().find((folder) => folder.id === folderId);
        if (currentFolder) {
          return currentFolder.parentId || null;
        }
      }
      return null;
    });
  }

  protected changeCurrentFolder(folderId: FolderId | null) {
    this.currentFolder.set(folderId);
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
