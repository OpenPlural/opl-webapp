import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BRANCH, IS_STAGING, WEBSITE_URL } from '../../environment';

@Component({
  selector: 'app-staging-warning',
  imports: [TranslatePipe],
  templateUrl: './staging-warning.html',
})
export class StagingWarning {
  protected readonly IS_STAGING = IS_STAGING;
  protected readonly WEBSITE_URL = WEBSITE_URL;
  protected readonly BRANCH = BRANCH;
}
