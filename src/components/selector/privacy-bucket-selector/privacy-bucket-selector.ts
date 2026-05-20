import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { Selector } from '../selector/selector';
import { PrivacyBucket, PrivacyBucketId } from '../../../services/model/Privacy';
import { PrivacyBucketListItem } from '../../list-item/privacy-bucket-list-item/privacy-bucket-list-item';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../loading/loading';

@Component({
  selector: 'app-privacy-bucket-selector',
  imports: [Selector, PrivacyBucketListItem, Loading],
  templateUrl: './privacy-bucket-selector.html',
})
export class PrivacyBucketSelector implements OnInit {
  private readonly webService = inject(WebService);

  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly selection = input<PrivacyBucketId[]>([]);
  readonly submitSelection = output<PrivacyBucketId[]>();
  readonly forceClose = output();

  readonly buckets = signal<PrivacyBucket[] | null>(null);
  readonly updatedSelection = signal<PrivacyBucketId[]>([]);

  ngOnInit() {
    this.webService.getPrivacyBuckets().then((buckets) => {
      this.buckets.set(buckets);
    });

    this.updatedSelection.set(this.selection());
  }

  protected setSelected(id: PrivacyBucketId, selected: boolean) {
    if (selected) {
      this.updatedSelection.update((selection) => [...selection, id]);
    } else {
      this.updatedSelection.update((selection) => selection.filter((v) => v !== id));
    }
  }
}
