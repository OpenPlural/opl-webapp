import {Component, inject, signal} from '@angular/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {TranslatePipe} from '@ngx-translate/core';
import {ImportFlags, SPImportService} from '../../../services/SPImportService';
import {SyncService} from '../../../services/SyncService';

@Component({
  selector: 'app-data-import',
  imports: [
    NavPageContainer,
    TranslatePipe
  ],
  templateUrl: './data-import.html',
  styleUrl: './data-import.css',
})
export class DataImport {
  private readonly importService = inject(SPImportService);

  protected readonly importing = signal<boolean>(false);

  protected importData(event: SubmitEvent) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const file = formData.get('file');
    const folders = formData.get('folders')?.toString() === 'on';
    const members = formData.get('members')?.toString() === 'on';
    const customFront = formData.get('customFront')?.toString() === 'on';
    const customFields = formData.get('customFields')?.toString() === 'on';
    const privacyBuckets = formData.get('privacyBuckets')?.toString() === 'on';

    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = () => this.runImport(reader.result as string, {
        folders,
        members,
        customFront,
        customFields,
        privacyBuckets,
      });
      reader.readAsText(file);
    }
  }

  private async runImport(fileContent: string, flags: ImportFlags) {
    if (fileContent.length === 0) {
      return;
    }

    try {
      this.importing.set(true);
      await this.importService.importFromSimplyPlural(fileContent, flags);
      location.reload();
    } finally {
      this.importing.set(false);
    }
  }
}
