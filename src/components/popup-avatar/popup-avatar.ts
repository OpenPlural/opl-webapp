import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WebService } from '../../services/WebService';

export const CDN_MAX_FILE_SIZE_MB = 2;
export const CDN_MAX_FILE_SIZE_B = CDN_MAX_FILE_SIZE_MB * 1048576;

@Component({
  selector: 'app-popup-avatar',
  imports: [TranslatePipe],
  templateUrl: './popup-avatar.html',
})
export class PopupAvatar {
  private readonly webService = inject(WebService);

  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly label = input.required<string>();
  readonly initialValue = input<string>('');
  readonly submitValue = output<string>();

  protected readonly fileTooLarge = signal<boolean>(false);

  protected readonly realInitialValue = computed(() => {
    const initialValue = this.initialValue();
    if (initialValue.startsWith(':cdn:')) {
      return '';
    }
    return initialValue;
  });

  protected async onChangeFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileTooLarge.set(file.size > CDN_MAX_FILE_SIZE_B);
    }
  }

  protected async submitForm(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const file = formData.get('file');

    let value;
    if (file instanceof File) {
      if (this.fileTooLarge()) {
        return;
      }
      const bytes = await file.bytes();
      value = await this.webService.uploadToCdn(bytes, file.type.replace("image/", ""));
    } else {
      value = formData.get('value')?.toString().trim();
    }

    this.submitValue.emit(value || '');
    form.reset();
  }

  protected readonly CDN_MAX_FILE_SIZE_MB = CDN_MAX_FILE_SIZE_MB;
}
