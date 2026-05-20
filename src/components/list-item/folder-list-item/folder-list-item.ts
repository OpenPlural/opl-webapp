import { Component, computed, input, output } from '@angular/core';
import { Folder } from '../../../services/model/Folder';
import { ListItem } from '../list-item/list-item';
import { toColor } from '../../../util/ColorConvert';
import { VerticalCenter } from '../../vertical-center/vertical-center';

@Component({
  selector: 'app-folder-list-item',
  imports: [ListItem, VerticalCenter],
  templateUrl: './folder-list-item.html',
})
export class FolderListItem {
  readonly folder = input.required<Folder>();
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly action = output();
}
