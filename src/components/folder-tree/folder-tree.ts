import { Component, computed, input, output, signal } from '@angular/core';
import { Folder, FolderId } from '../../services/model/Folder';
import { FolderListItem } from '../list-item/folder-list-item/folder-list-item';

@Component({
  selector: 'app-folder-tree',
  imports: [FolderListItem],
  templateUrl: './folder-tree.html',
})
export class FolderTree {
  readonly folder = input.required<Folder>();
  readonly folders = input.required<Folder[]>();
  readonly selected = input.required<FolderId[]>();
  readonly toggleSelected = output<FolderId>();

  protected readonly children = computed(() => {
    const folder = this.folder();
    return this.folders().filter((f) => f.parentId === folder.id);
  });
  protected readonly currentSelected = computed(() => this.selected().includes(this.folder().id));

  protected readonly expanded = signal<boolean>(true);
}
