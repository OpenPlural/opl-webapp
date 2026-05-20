import { Component, input } from '@angular/core';
import { CustomFieldValue } from '../../../components/custom-field-value/custom-field-value';
import { ViewedCustomFieldDataValue } from '../../../services/model/Field';

@Component({
  selector: 'app-friend-member-custom-fields-page',
  imports: [CustomFieldValue],
  templateUrl: './friend-member-custom-fields-page.html',
})
export class FriendMemberCustomFieldsPage {
  readonly fields = input.required<ViewedCustomFieldDataValue[]>();
}
