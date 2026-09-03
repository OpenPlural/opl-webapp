import { Component, input, output } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-page-container',
  imports: [CdkScrollable],
  templateUrl: './page-container.html',
  styleUrl: './page-container.css',
})
export class PageContainer {
  readonly footer = input<boolean>(false);
  readonly fab = input<boolean>(false);
  readonly fabAction = output();
}
