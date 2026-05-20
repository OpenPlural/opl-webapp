import { Component, inject, input, output } from '@angular/core';
import { PageContainer } from '../page-container/page-container';
import { VerticalCenter } from '../../vertical-center/vertical-center';
import { IconButton } from '../../icon-button/icon-button';
import { Location } from '@angular/common';

@Component({
  selector: 'app-edit-page-container',
  imports: [PageContainer, VerticalCenter, IconButton],
  templateUrl: './edit-page-container.html',
})
export class EditPageContainer {
  private readonly location = inject(Location);

  readonly title = input.required<string>();
  readonly save = output();
  readonly delete = output();

  protected goBack() {
    this.location.back();
  }
}
