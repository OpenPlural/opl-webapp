import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-toggle-icon-button',
  imports: [TranslatePipe],
  templateUrl: './toggle-icon-button.html',
})
export class ToggleIconButton {
  readonly name = input.required<string>();
  readonly toggledName = input<string>();
  readonly icon = input.required<string>();
  readonly size = input<string>('fa-lg');
  readonly toggled = input.required<boolean>();
  readonly disabled = input<boolean>(false);
  readonly toggle = output();
}
