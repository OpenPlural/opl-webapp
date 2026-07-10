import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {WebService} from '../../../services/WebService';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {TranslatePipe} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {toJson} from '../../../util/FixedJson';
import {truncateCurrentDate} from '../../../util/DateTruncate';

@Component({
  selector: 'app-data-export',
  imports: [
    NavPageContainer,
    TranslatePipe
  ],
  templateUrl: './data-export.html',
})
export class DataExport implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly webService = inject(WebService);

  private readonly subscription = signal<Subscription | null>(null);
  protected readonly exportFormat = signal<string | null>(null);
  protected readonly exporting = signal<boolean>(false);

  ngOnInit() {
    this.subscription.set(
      this.route.data.subscribe((data) => {
        this.exportFormat.set(data['format']);
      }),
    );
  }

  ngOnDestroy() {
    this.subscription()?.unsubscribe();
  }

  protected async exportData() {
    let url;
    let element;
    try {
      this.exporting.set(true);
      let data: any;
      switch (this.exportFormat()) {
        case 'openPlural':
          data = await this.webService.export();
          break;
      }

      url = URL.createObjectURL(new Blob([toJson(data)], {type: 'application/json'}));

      element = document.createElement('a');
      element.href = url;
      element.download = `export-${truncateCurrentDate()}.openplural.json`;
      document.body.appendChild(element);

      element.click();
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
      if (element) {
        document.body.removeChild(element);
      }
      this.exporting.set(false);
    }
  }
}
