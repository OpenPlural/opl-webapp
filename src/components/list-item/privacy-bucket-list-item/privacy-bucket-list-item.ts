import { Component, input, output } from '@angular/core';
import { PrivacyBucket } from '../../../services/model/Privacy';
import { ListItem } from '../list-item/list-item';
import { TranslatePipe } from '@ngx-translate/core';
import { VerticalCenter } from '../../vertical-center/vertical-center';

@Component({
  selector: 'app-privacy-bucket-list-item',
  imports: [ListItem, TranslatePipe, VerticalCenter],
  templateUrl: './privacy-bucket-list-item.html',
})
export class PrivacyBucketListItem {
  readonly bucket = input.required<PrivacyBucket>();
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly selectionStatus = output<boolean>();
  readonly action = output();
}
