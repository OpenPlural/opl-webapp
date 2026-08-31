import { Component, inject, input } from '@angular/core';
import { Poll } from '../../services/model/Poll';
import { CustomFieldId } from '../../services/model/Field';
import { SettingsService } from '../../services/SettingsService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-poll-link',
  imports: [],
  templateUrl: './poll-link.html',
  styleUrl: './poll-link.css',
})
export class PollLink {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);

  readonly poll = input.required<Poll>();

  protected formatOpenUntil(poll: Poll): string {
    return this.settingsService.formatDate(Date.parse(poll.openUntil), 'DateTime');
  }

  protected gotoPoll(id: CustomFieldId) {
    this.router.navigate(['app', 'poll', id]);
  }
}
