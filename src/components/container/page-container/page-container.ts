import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-container',
  imports: [],
  templateUrl: './page-container.html',
  styleUrl: './page-container.css',
})
export class PageContainer {
  readonly footer = input<boolean>(false);
  readonly fab = input<boolean>(false);
  readonly fabAction = output();
}
