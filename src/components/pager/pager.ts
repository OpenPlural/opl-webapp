import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-pager',
  imports: [TranslatePipe],
  templateUrl: './pager.html',
})
export class Pager {
  readonly currentPage = input.required<string>();
  readonly placement = input('bottom-17');
  readonly rounding = input('rounded-t-lg');
  readonly justify = input('justify-evenly');
}
