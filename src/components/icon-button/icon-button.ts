import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-icon-button',
  imports: [TranslatePipe],
  templateUrl: './icon-button.html',
})
export class IconButton {
  readonly name = input.required<string>();
  readonly icon = input.required<string | string[]>();
  readonly stack = input<boolean>(false);
  readonly size = input<string>('fa-lg');
  readonly buttonSize = input<string>('btn-lg');
  readonly buttonClass = input<string>('');
  readonly buttonDisabled = input<boolean>(false);
  readonly action = output();
}
