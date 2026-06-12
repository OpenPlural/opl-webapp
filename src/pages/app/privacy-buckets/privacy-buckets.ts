import { Component, inject, OnInit, signal } from '@angular/core';
import { Loading } from '../../../components/loading/loading';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { WebService } from '../../../services/WebService';
import { makePrivacyBucket, PrivacyBucket, PrivacyBucketId } from '../../../services/model/Privacy';
import { Router } from '@angular/router';
import { PopupInput } from '../../../components/popup-input/popup-input';
import { PrivacyBucketListItem } from '../../../components/list-item/privacy-bucket-list-item/privacy-bucket-list-item';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { compareCustomSort } from '../../../util/CustomSort';
import { openDialog } from '../../../util/CommonFunctions';
import {ToggleIconButton} from '../../../components/toggle-icon-button/toggle-icon-button';
import {VerticalCenter} from '../../../components/vertical-center/vertical-center';

@Component({
  selector: 'app-privacy-buckets',
  imports: [Loading, NavPageContainer, PopupInput, PrivacyBucketListItem, CdkDropList, CdkDrag, ToggleIconButton, VerticalCenter],
  templateUrl: './privacy-buckets.html',
  styleUrl: './privacy-buckets.css',
})
export class PrivacyBuckets implements OnInit {
  private readonly router = inject(Router);
  private readonly webService = inject(WebService);

  protected readonly reorder = signal<boolean>(false);
  protected readonly buckets = signal<PrivacyBucket[] | null>(null);

  ngOnInit() {
    this.webService.getPrivacyBuckets().then((buckets) => {
      this.buckets.set(buckets.sort(compareCustomSort));
    });
  }

  protected gotoPrivacyBucket(id: PrivacyBucketId) {
    this.router.navigate(['app', 'privacy-bucket', id]);
  }

  protected toggleReorder() {
    this.reorder.update(b => !b);
  }

  protected async reorderBuckets(event: CdkDragDrop<any, any>) {
    const buckets = this.buckets();
    if (!buckets) return;

    const updatedBuckets = [...buckets];
    moveItemInArray(updatedBuckets, event.previousIndex, event.currentIndex);
    for (let i = 0; i < updatedBuckets.length; i++) {
      updatedBuckets[i].sort = BigInt(i + 1);
    }
    this.buckets.set(updatedBuckets);
    await this.webService.reorderPrivacyBuckets(updatedBuckets.map((bucket) => bucket.id));
  }

  protected async createBucket(name: string) {
    if (name.length === 0) {
      return;
    }

    const buckets = this.buckets();
    if (!buckets) return;

    let lastSortId = 0n;
    for (const bucket of buckets) {
      if (bucket.sort > lastSortId) {
        lastSortId = bucket.sort;
      }
    }

    const bucket = makePrivacyBucket(name, lastSortId + 1n);
    bucket.id = await this.webService.createPrivacyBucket(bucket);
    this.gotoPrivacyBucket(bucket.id);
  }

  protected readonly openDialog = openDialog;
}
