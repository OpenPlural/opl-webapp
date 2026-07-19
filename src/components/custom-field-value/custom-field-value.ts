import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  CUSTOM_FIELD_DATA_TYPE_COLOR,
  CUSTOM_FIELD_DATA_TYPE_DATE,
  CUSTOM_FIELD_DATA_TYPE_DATETIME,
  CUSTOM_FIELD_DATA_TYPE_TEXT,
  CUSTOM_FIELD_DATA_TYPE_TIME,
  CustomField,
  CustomFieldDataValue, ViewedCustomFieldDataValue
} from '../../services/model/Field';
import { ColorInput } from '../color-input/color-input';
import { toColor, toColorInt } from '../../util/ColorConvert';
import { SettingsService } from '../../services/SettingsService';
import { nullableField } from '../../util/NullString';
import { IconButton } from '../icon-button/icon-button';
import { VerticalCenter } from '../vertical-center/vertical-center';
import {MarkdownBox} from '../markdown-box/markdown-box';
import { truncateDateToInputValue } from '../../util/DateTruncate';

@Component({
  selector: 'app-custom-field-value',
  imports: [ColorInput, IconButton, VerticalCenter, MarkdownBox],
  templateUrl: './custom-field-value.html',
})
export class CustomFieldValue {
  private readonly settingsService = inject(SettingsService);

  readonly field = input.required<CustomField | ViewedCustomFieldDataValue>();
  readonly value = input.required<CustomFieldDataValue | ViewedCustomFieldDataValue | null>();
  readonly editable = input.required<boolean>();
  readonly changeValue = output<string>();
  readonly clearValue = output();

  protected readonly valueCleared = signal<boolean>(false);

  protected readonly colorValue = computed(() => {
    const value = this.value();
    if (!value) return 0n;

    try {
      return toColorInt(value.value);
    } catch (e) {
      return 0n;
    }
  });
  protected readonly dateValue = computed(() => {
    const field = this.field();
    if (
      field.dataType != CUSTOM_FIELD_DATA_TYPE_DATE &&
      field.dataType != CUSTOM_FIELD_DATA_TYPE_DATETIME
    )
      return null;

    const value = this.value();
    if (!value) return null;

    return new Date(parseInt(value.value)).toISOString().substring(0, 10);
  });
  protected readonly dateTimeValue = computed(() => {
    const field = this.field();
    if (
      field.dataType != CUSTOM_FIELD_DATA_TYPE_DATE &&
      field.dataType != CUSTOM_FIELD_DATA_TYPE_DATETIME
    )
      return null;

    const value = this.value();
    if (!value) return null;

    return truncateDateToInputValue(new Date(parseInt(value.value)));
  });
  protected readonly dateTimeFormatted = computed(() => {
    const field = this.field();
    if (
      field.dataType != CUSTOM_FIELD_DATA_TYPE_DATE &&
      field.dataType != CUSTOM_FIELD_DATA_TYPE_DATETIME
    )
      return null;

    const value = this.value();
    if (!value) return null;

    return this.settingsService.formatDate(parseInt(value.value), field.dataType, false);
  });
  protected readonly timeFormatted = computed(() => {
    const field = this.field();
    if (field.dataType != CUSTOM_FIELD_DATA_TYPE_TIME) return null;

    const value = this.value();
    if (!value) return null;

    return this.settingsService.formatTime(value.value);
  });

  protected textChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.textChangedRaw(input.value);
  }

  protected textChangedRaw(text: string | null | undefined) {
    const value = nullableField(text);
    if (value) {
      this.changeValue.emit(value);
      this.valueCleared.set(false);
    } else {
      this.fieldClear();
    }
  }

  protected colorChanged(color: bigint) {
    const hexColor = toColor(color);
    this.changeValue.emit(hexColor);
    this.valueCleared.set(false);
  }

  protected dateTimeChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    const timestamp = Date.parse(input.value);
    this.changeValue.emit(timestamp.toString());
    this.valueCleared.set(false);
  }

  protected fieldClear() {
    this.clearValue.emit();
    this.valueCleared.set(true);
  }

  protected readonly CUSTOM_FIELD_DATA_TYPE_TEXT = CUSTOM_FIELD_DATA_TYPE_TEXT;
  protected readonly CUSTOM_FIELD_DATA_TYPE_COLOR = CUSTOM_FIELD_DATA_TYPE_COLOR;
  protected readonly CUSTOM_FIELD_DATA_TYPE_DATE = CUSTOM_FIELD_DATA_TYPE_DATE;
  protected readonly CUSTOM_FIELD_DATA_TYPE_DATETIME = CUSTOM_FIELD_DATA_TYPE_DATETIME;
  protected readonly CUSTOM_FIELD_DATA_TYPE_TIME = CUSTOM_FIELD_DATA_TYPE_TIME;
}
