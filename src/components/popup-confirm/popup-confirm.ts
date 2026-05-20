import { Component, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-popup-confirm',
  imports: [TranslatePipe],
  templateUrl: './popup-confirm.html',
})
export class PopupConfirm {
  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly confirmations = input(1);
  readonly confirm = output();

  protected readonly count = signal(0);

  protected increaseCount() {
    this.count.update(i => i + 1);

    if (this.count() >= this.confirmations()) {
      this.confirm.emit();
    }
  }

  protected resetCount() {
    this.count.set(0);
  }
}
