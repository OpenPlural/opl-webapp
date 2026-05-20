import { Component, input, output } from '@angular/core';
import { UserInfo } from '../../../services/model/User';
import { ListItem } from '../list-item/list-item';
import { VerticalCenter } from '../../vertical-center/vertical-center';
import { ProfilePicture } from '../../profile-picture/profile-picture';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list-item',
  imports: [ListItem, VerticalCenter, ProfilePicture, FormsModule],
  templateUrl: './user-list-item.html',
})
export class UserListItem {
  readonly user = input.required<UserInfo>();
  readonly subtext = input<string>();
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly selectionStatus = output<boolean>();
  readonly action = output();
}
