import { Component, input, output } from '@angular/core';
import { VerticalCenter } from '../vertical-center/vertical-center';
import { IconButton } from '../icon-button/icon-button';
import { openDialog } from '../../util/CommonFunctions';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search-options',
  imports: [VerticalCenter, IconButton, TranslatePipe],
  templateUrl: './search-options.html',
})
export class SearchOptions {
  readonly flags = input.required<SearchFlags>();
  readonly canSearchCustomFields = input.required<boolean>();
  readonly changeFlags = output<SearchFlags>();

  protected submitSearchOptions(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('searchName')?.toString() === 'on';
    const pronouns = formData.get('searchPronouns')?.toString() === 'on';
    const description = formData.get('searchDesc')?.toString() === 'on';
    const customFields = formData.get('searchFields')?.toString() === 'on' && this.canSearchCustomFields();
    const archived = formData.get('showArchived')?.toString() === 'on';
    this.changeFlags.emit({
      name,
      pronouns,
      description,
      customFields,
      archived,
    });
  }

  protected readonly openDialog = openDialog;
}

export type SearchFlags = {
  name: boolean;
  pronouns: boolean;
  description: boolean;
  customFields: boolean;
  archived: boolean;
};

export function defaultSearchFlags(): SearchFlags {
  return {
    name: true,
    pronouns: false,
    description: false,
    customFields: false,
    archived: false,
  };
}
