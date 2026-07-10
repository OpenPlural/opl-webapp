import {Component, inject} from '@angular/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {TranslatePipe} from '@ngx-translate/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-data-import-export',
  imports: [
    NavPageContainer,
    TranslatePipe
  ],
  templateUrl: './data-import-export.html',
})
export class DataImportExport {
  private readonly router = inject(Router);

  protected import(format: string) {
    this.router.navigate(['app', 'data-import', format]);
  }

  protected export(format: string) {
    this.router.navigate(['app', 'data-export', format]);
  }
}
