import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {TranslatePipe} from '@ngx-translate/core';
import {ImportFlags, ImportService} from '../../../services/ImportService';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-data-import',
  imports: [
    NavPageContainer,
    TranslatePipe
  ],
  templateUrl: './data-import.html',
})
export class DataImport implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly importService = inject(ImportService);

  private readonly subscription = signal<Subscription | null>(null);
  protected readonly importFormat = signal<string | null>(null);
  protected readonly importing = signal<boolean>(false);

  ngOnInit() {
    this.subscription.set(
      this.route.data.subscribe((data) => {
        this.importFormat.set(data['format']);
      }),
    );
  }

  ngOnDestroy() {
    this.subscription()?.unsubscribe();
  }

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
    const truncate = formData.get('truncate')?.toString() === 'on';

    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = () => this.runImport(reader.result as string, {
        folders,
        members,
        customFront,
        customFields,
        privacyBuckets,
        truncate,
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
      switch (this.importFormat()) {
        case 'simplyPlural':
          await this.importService.importFromSimplyPlural(fileContent, flags);
          break;
        case 'openPlural':
          await this.importService.importFromOpenPlural(fileContent, flags);
          break;
      }
      location.reload();
    } finally {
      this.importing.set(false);
    }
  }
}
