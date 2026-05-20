import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Member } from '../../../services/model/Member';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { compareCustomSort } from '../../../util/CustomSort';
import { CustomFieldValue } from '../../../components/custom-field-value/custom-field-value';
import { IconButton } from '../../../components/icon-button/icon-button';
import { CustomField, CustomFieldDataValue, makeCustomFieldValue } from '../../../services/model/Field';
import { truncateCurrentDate } from '../../../util/DateTruncate';

@Component({
  selector: 'app-member-custom-fields-page',
  imports: [CustomFieldValue, IconButton],
  templateUrl: './member-custom-fields-page.html',
})
export class MemberCustomFieldsPage {
  private readonly localStorageService = inject(LocalStorageService);

  readonly member = input.required<Member>();
  readonly editingData = output<boolean>();
  readonly fieldUpdates = output<CustomFieldDataUpdate[]>()

  protected readonly editing = signal<boolean>(false);
  protected readonly updatedFields = signal<CustomFieldDataUpdate[] | null>(null);

  protected readonly customFields = computed(() =>
    this.localStorageService.customFields().sort(compareCustomSort),
  );
  protected readonly customFieldValues = computed(() => {
    let fieldValues = this.localStorageService.customFieldValues().filter((fv) => fv.memberId == this.member().id);
    const updatedFields = this.updatedFields();
    if (updatedFields) {
      const updatedFieldValues = updatedFields.map((u) => u.newValue)
        .filter((v) => v !== null);
      fieldValues = fieldValues.filter((fv) => !updatedFieldValues.some((ufv) => ufv.fieldId === fv.fieldId));
      fieldValues.push(...updatedFieldValues);
    }
    return fieldValues;
  });
  protected readonly customFieldValuePairs = computed(() => {
    const fields = this.customFields();
    const values = this.customFieldValues();
    return fields.map((field) => {
      const value = values.find((fv) => fv.fieldId == field.id) || null;
      return { field, value };
    });
  });

  protected toggleEdit() {
    this.editing.update((b) => !b);

    const editing = this.editing();
    this.editingData.emit(editing);
    if (!editing) {
      const updatedFields = this.updatedFields();
      if (updatedFields) {
        this.fieldUpdates.emit(updatedFields);
      }
    }
  }

  protected changeValue(field: CustomField, oldValue: CustomFieldDataValue | null, value: string) {
    let newValue: CustomFieldDataValue;
    if (oldValue) {
      newValue = { ...oldValue, value };
    } else {
      newValue = makeCustomFieldValue(field.id, this.member().id, value);
    }
    newValue.updatedAt = truncateCurrentDate();

    this.updatedFields.update((fields) => {
      if (fields === null) {
        fields = [];
      } else {
        fields = fields.filter((f) => f.field.id !== field.id);
      }
      fields.push({field, oldValue, newValue});
      return fields;
    });
  }

  protected clearValue(field: CustomField, oldValue: CustomFieldDataValue | null) {
    this.updatedFields.update((fields) => {
      if (fields === null) {
        fields = [];
      } else {
        fields = fields.filter((f) => f.field.id !== field.id);
      }
      fields.push({field, oldValue, newValue: null});
      return fields;
    });
  }
}

export type CustomFieldDataUpdate = {
  field: CustomField,
  oldValue: CustomFieldDataValue | null,
  newValue: CustomFieldDataValue | null
};
