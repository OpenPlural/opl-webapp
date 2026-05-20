import { Component, computed, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { toColor, toColorInt } from '../../util/ColorConvert';
import { ColorPicker } from '../color-picker/color-picker';
import { SettingsService } from '../../services/SettingsService';

@Component({
  selector: 'app-color-input',
  imports: [ColorPicker],
  templateUrl: './color-input.html',
})
export class ColorInput implements OnInit {
  private readonly settingsService = inject(SettingsService);

  private readonly colorPicker = viewChild.required(ColorPicker);

  readonly dialogId = input.required<string>();
  readonly initialValue = input.required<bigint>();
  readonly editable = input.required<boolean>();
  readonly clearedValue = input<boolean>(false);
  readonly selectColor = output<bigint>();

  protected readonly color = signal<string>('#000000');

  protected readonly useCustomColorPicker = computed(() => !this.settingsService.settings().useNativeColorPicker);

  ngOnInit() {
    this.color.set(toColor(this.initialValue()));
  }

  protected openColorPicker(event: PointerEvent) {
    if (this.editable()) {
      if (this.useCustomColorPicker()) {
        event.preventDefault();

        this.colorPicker().openColorPicker();
      }
    } else {
      event.preventDefault();
    }
  }

  protected valueChanged(event: Event) {
    if (this.useCustomColorPicker()) return;
    event.stopPropagation();

    const input = event.target as HTMLInputElement;
    this.selectColor.emit(toColorInt(input.value));
  }

  protected submitColor(color: string) {
    this.color.set(color);
    this.selectColor.emit(toColorInt(color));
  }
}
