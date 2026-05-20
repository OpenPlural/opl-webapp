import { MemberId } from './Member';
import { generateLocalId } from '../../util/IdGenerator';
import { truncateCurrentDate } from '../../util/DateTruncate';

export type CustomFieldId = bigint;
export type CustomFieldDataId = bigint;

export const CUSTOM_FIELD_DATA_TYPE_TEXT = "Text";
export const CUSTOM_FIELD_DATA_TYPE_COLOR = "Color";
export const CUSTOM_FIELD_DATA_TYPE_DATE = "Date";
export const CUSTOM_FIELD_DATA_TYPE_TIME = "Time";
export const CUSTOM_FIELD_DATA_TYPE_DATETIME = "DateTime";
export const CUSTOM_FIELD_DATA_TYPES = [
  CUSTOM_FIELD_DATA_TYPE_TEXT,
  CUSTOM_FIELD_DATA_TYPE_COLOR,
  CUSTOM_FIELD_DATA_TYPE_DATE,
  CUSTOM_FIELD_DATA_TYPE_TIME,
  CUSTOM_FIELD_DATA_TYPE_DATETIME
];

export interface CustomField {
  id: CustomFieldId;
  remoteId: CustomFieldId | null;
  sort: bigint;
  name: string;
  dataType: string;
  updatedAt: string;
}

export interface CustomFieldDataValue {
  id: CustomFieldDataId;
  remoteId: CustomFieldDataId | null;
  fieldId: CustomFieldId;
  memberId: MemberId;
  value: string;
  updatedAt: string;
}

export interface ViewedCustomFieldDataValue {
  id: CustomFieldId;
  sort: bigint;
  name: string;
  dataType: string;
  value: string;
}

export function makeCustomField(name: string, sort: bigint): CustomField {
  return {
    id: generateLocalId(),
    remoteId: null,
    sort,
    name,
    dataType: CUSTOM_FIELD_DATA_TYPE_TEXT,
    updatedAt: truncateCurrentDate(),
  };
}

export function makeCustomFieldValue(fieldId: CustomFieldId, memberId: MemberId, value: string) {
  return {
    id: generateLocalId(),
    remoteId: null,
    fieldId,
    memberId,
    value,
    updatedAt: truncateCurrentDate(),
  }
}
