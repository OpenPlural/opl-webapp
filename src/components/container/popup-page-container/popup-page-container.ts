import { Component, inject, input } from '@angular/core';
import { PageContainer } from '../page-container/page-container';
import { Location } from '@angular/common';
import { IconButton } from '../../icon-button/icon-button';
import { VerticalCenter } from '../../vertical-center/vertical-center';

@Component({
  selector: 'app-popup-page-container',
  imports: [PageContainer, IconButton, VerticalCenter],
  templateUrl: './popup-page-container.html',
})
export class PopupPageContainer {
  private readonly location = inject(Location);

  readonly title = input.required<string>();
  readonly footer = input<boolean>(false);

  protected goBack() {
    this.location.back();
  }
}
