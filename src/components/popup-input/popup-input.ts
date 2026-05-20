import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-popup-input',
  imports: [TranslatePipe],
  templateUrl: './popup-input.html',
})
export class PopupInput {
  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly label = input.required<string>();
  readonly initialValue = input<string>('');
  readonly inputType = input<string>('text');
  readonly submitValue = output<string>();

  protected submitForm(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const value = formData.get('value')?.toString().trim();
    this.submitValue.emit(value || '');
    form.reset();
  }
}
