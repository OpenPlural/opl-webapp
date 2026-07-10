import {Component, inject, input, output, signal} from '@angular/core';
import { PageContainer } from '../page-container/page-container';
import {Location, NgClass} from '@angular/common';
import { IconButton } from '../../icon-button/icon-button';
import { VerticalCenter } from '../../vertical-center/vertical-center';
import {ToggleIconButton} from '../../toggle-icon-button/toggle-icon-button';

@Component({
  selector: 'app-popup-page-container',
  imports: [PageContainer, IconButton, VerticalCenter, ToggleIconButton, NgClass],
  templateUrl: './popup-page-container.html',
})
export class PopupPageContainer {
  private readonly location = inject(Location);

  readonly title = input.required<string>();
  readonly footer = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly search = output<string | null>();

  protected readonly searching = signal(false);

  protected toggleSearch() {
    this.searching.update((b) => {
      if (b) {
        this.search.emit(null);
      }
      return !b;
    });
  }

  protected goBack() {
    this.location.back();
  }
}
