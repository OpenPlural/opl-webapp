import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-selector',
  imports: [TranslatePipe],
  templateUrl: './selector.html',
})
export class Selector {
  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly submitSelection = output();
  readonly forceClose = output();

  protected submitForm(event: SubmitEvent) {
    event.preventDefault();
    this.submitSelection.emit();
    const form = event.target as HTMLFormElement;
    form.reset();
  }
}
