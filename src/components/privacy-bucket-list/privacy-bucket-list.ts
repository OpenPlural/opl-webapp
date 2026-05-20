import { Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { VerticalCenter } from '../vertical-center/vertical-center';
import { toColor } from '../../util/ColorConvert';
import { PrivacyBucketId, SimplePrivacyBucket } from '../../services/model/Privacy';
import { PrivacyBucketSelector } from '../selector/privacy-bucket-selector/privacy-bucket-selector';

@Component({
  selector: 'app-privacy-bucket-list',
  imports: [TranslatePipe, VerticalCenter, PrivacyBucketSelector],
  templateUrl: './privacy-bucket-list.html',
})
export class PrivacyBucketList {
  readonly buckets = input.required<SimplePrivacyBucket[]>();
  readonly title = input.required<string>();
  readonly change = signal<boolean>(false);
  readonly bucketIds = computed(() => this.buckets()?.map((bucket) => bucket.id) || []);
  readonly submitSelection = output<PrivacyBucketId[]>();

  protected submit(ids: PrivacyBucketId[]) {
    this.submitSelection.emit(ids);
    this.change.set(false);
  }

  protected readonly toColor = toColor;
}
