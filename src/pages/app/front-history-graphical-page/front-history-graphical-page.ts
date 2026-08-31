import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { FrontEntry, FrontEntryId } from '../../../services/model/Front';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../../components/loading/loading';
import { Member } from '../../../services/model/Member';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { toColor } from '../../../util/ColorConvert';
import { SettingsService } from '../../../services/SettingsService';
import { openDialog } from '../../../util/CommonFunctions';
import { HistoricFrontEntry } from '../../../components/historic-front-entry/historic-front-entry';

const TIME_LABELS = ["22:00", "20:00", "18:00", "16:00", "14:00", "12:00", "10:00", "08:00", "06:00", "04:00", "02:00"];
type RenderedFrontEntry = {
  entry: FrontEntry;
  member: Member;
  row: number;
  column: number;
  height: number;
};

@Component({
  selector: 'app-front-history-graphical-page',
  imports: [
    VerticalCenter,
    Loading,
    HistoricFrontEntry,
  ],
  templateUrl: './front-history-graphical-page.html',
  styleUrl: './front-history-graphical-page.css',
})
export class FrontHistoryGraphicalPage implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  protected readonly selectedEntry = signal<FrontEntryId | null>(null);
  protected readonly historyStart = signal<string | null>(null);
  protected readonly historyEnd = signal<string | null>(null);
  protected readonly frontHistory = signal<FrontEntry[] | null>(null);
  protected readonly renderedHistory = computed(() => {
    let historyEnd = this.historyEnd();
    if (!historyEnd) return null;

    let history = this.frontHistory();
    if (!history) return null;

    const members = this.localStorageService.members();

    const historyEndSplit = historyEnd.split(/\D/);
    const historyTime = new Date(
      +historyEndSplit[0],
      +historyEndSplit[1] - 1,
      +historyEndSplit[2],
      23,
      59,
      59,
      999,
    ).getTime();

    history = [...history].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));

    const render: RenderedFrontEntry[] = [];
    for (const entry of history) {
      let member = members.find((member) => member.id === entry.member);
      if (!member) continue;

      let row: number;
      if (entry.endedAt) {
        const endedAt = new Date(Date.parse(entry.endedAt));
        const daysDiff = Math.floor((historyTime - Date.parse(entry.endedAt)) / 86400000);
        row = (1440 - endedAt.getHours() * 60 - endedAt.getMinutes()) * (1 / 3) + daysDiff * 480;
      } else {
        row = 0;
      }
      const startedAt = new Date(Date.parse(entry.startedAt));
      const startedDaysDiff = Math.floor((historyTime - Date.parse(entry.startedAt)) / 86400000);
      const startedRow =
        (1440 - startedAt.getHours() * 60 - startedAt.getMinutes()) * (1 / 3) +
        startedDaysDiff * 480;
      let height = startedRow - row;
      if (height < 60) {
        row -= 60 - height;
        height = 60;
      }
      let column = 0;
      while (render.some((e) => e.column === column && row + height + 20 >= e.row)) {
        column++;
      }

      render.push({ entry, member, row, column, height });
    }
    return render.reverse();
  });
  protected readonly hours = computed(() =>
    TIME_LABELS.map((time) => this.settingsService.formatTime(time)),
  );
  protected readonly days = computed(() => {
    const newest = this.historyEnd();
    const oldest = this.historyStart();
    if (!newest || !oldest) return [];

    const newestDate = Date.parse(newest);
    const oldestDate = Date.parse(oldest);

    const days: string[] = [];
    for (let date = newestDate; date >= oldestDate; date -= 86400000) {
      days.push(this.settingsService.formatDate(date, 'Date'));
    }
    return days;
  });

  constructor() {
    effect(() => {
      const start = this.historyStart();
      const end = this.historyEnd();
      if (start && end) {
        this.frontHistory.set(null);
        this.webService.getFrontHistoryInDateRange(start, end).then((frontHistory) => {
          this.frontHistory.set(frontHistory);
        });
      } else {
        this.frontHistory.set(null);
      }
    });
  }

  ngOnInit() {
    const end = new Date();
    const start = new Date(end.getTime() - 604800000); // 1 week ago
    this.historyStart.set(start.toISOString().split('T')[0]);
    this.historyEnd.set(end.toISOString().split('T')[0]);
  }

  protected changeHistoryStart(event: Event) {
    const input = event.target as HTMLInputElement;
    this.historyStart.set(input.value || null);
  }

  protected changeHistoryEnd(event: Event) {
    const input = event.target as HTMLInputElement;
    this.historyEnd.set(input.value || null);
  }

  protected selectEntry(entry: FrontEntryId | null, event: PointerEvent) {
    event.stopImmediatePropagation();

    this.selectedEntry.set(entry);
  }

  protected readonly toColor = toColor;
  protected readonly openDialog = openDialog;
}
