import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ProfilePicture } from '../../../components/profile-picture/profile-picture';
import { TranslatePipe } from '@ngx-translate/core';
import { toColor } from '../../../util/ColorConvert';
import { Member } from '../../../services/model/Member';
import { PopupInput } from '../../../components/popup-input/popup-input';
import { nullableField } from '../../../util/NullString';
import { openDialog } from '../../../util/CommonFunctions';
import { truncateCurrentDate } from '../../../util/DateTruncate';
import { ColorInput } from '../../../components/color-input/color-input';
import { Folder, FolderId } from '../../../services/model/Folder';
import { FolderTree } from '../../../components/folder-tree/folder-tree';

@Component({
  selector: 'app-member-profile-page',
  imports: [ProfilePicture, TranslatePipe, PopupInput, ColorInput, FolderTree],
  templateUrl: './member-profile-page.html',
})
export class MemberProfilePage {
  readonly member = input.required<Member>();
  readonly folders = input.required<Folder[] | null>();
  readonly editable = input.required<boolean>();
  readonly editSelectableFolders = input<Folder[]>([]);
  readonly updateMember = output<Member>();
  readonly updateFolders = output<FolderId[]>();

  protected readonly rootFolders = computed(() => this.editSelectableFolders().filter((f) => !f.parentId));

  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly color = signal<bigint | null>(null);
  protected readonly selectedFolders = signal<FolderId[] | null>(null);

  protected onUpdate() {
    const member = this.member();
    if (!member) return;

    const form = document.getElementById('memberForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    const pronouns = formData.get('pronouns')?.toString();
    const description = formData.get('description')?.toString();

    if (name && name.length > 0) {
      const updated = Object.assign({}, member);
      updated.name = name;
      updated.pronouns = nullableField(pronouns);
      updated.description = nullableField(description);
      updated.updatedAt = truncateCurrentDate();

      const newAvatar = this.avatarUrl();
      if (newAvatar != null) {
        updated.avatar = nullableField(newAvatar);
      }

      const newColor = this.color();
      if (newColor != null) {
        updated.color = newColor;
      }

      this.updateMember.emit(updated);
    }
  }

  protected async editAvatar(url: string) {
    this.avatarUrl.set(url);
    this.onUpdate();
  }

  protected colorSelected(color: bigint) {
    this.color.set(color);
    this.onUpdate();
  }

  protected openAvatarPrompt() {
    if (!this.editable()) {
      return;
    }
    openDialog('memberAvatarPrompt');
  }

  protected editFolders() {
    this.selectedFolders.set(this.member().folders);
  }

  protected toggleFolderSelected(folderId: FolderId) {
    this.selectedFolders.update((folders) => {
      if (folders === null) return null;
      if (folders.includes(folderId)) {
        return folders.filter((id) => id !== folderId);
      } else {
        return [...folders, folderId];
      }
    });

    const selected = this.selectedFolders();
    if (selected !== null) {
      this.updateFolders.emit(selected);
    }
  }

  protected readonly toColor = toColor;
}
