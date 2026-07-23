import { Component, input, output } from '@angular/core';
import { Folder } from '../../../services/model/Folder';
import { ListItem } from '../list-item/list-item';
import { VerticalCenter } from '../../vertical-center/vertical-center';
import { IconButton } from '../../icon-button/icon-button';
import { openDialog } from '../../../util/CommonFunctions';
import { MarkdownBox } from '../../markdown-box/markdown-box';

@Component({
  selector: 'app-folder-list-item',
  imports: [ListItem, VerticalCenter, IconButton, MarkdownBox],
  templateUrl: './folder-list-item.html',
})
export class FolderListItem {
  readonly folder = input.required<Folder>();
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly descriptionPopup = input<boolean>(false);
  readonly selectionStatus = output<boolean>();
  readonly action = output();
  protected readonly openDialog = openDialog;
}
