import { Component, computed, effect, inject, signal } from '@angular/core';
import { FrontEntry, FrontEntryId } from '../../../services/model/Front';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../../components/loading/loading';
import { Member } from '../../../services/model/Member';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { toColor } from '../../../util/ColorConvert';
import { SettingsService } from '../../../services/SettingsService';
import { openDialog } from '../../../util/CommonFunctions';
import { HistoricFrontEntry } from '../../../components/historic-front-entry/historic-front-entry';
import { DateRange, SelectedDateRange } from '../../../components/date-range/date-range';

const TIME_LABELS = ["22:00", "20:00", "18:00", "16:00", "14:00", "12:00", "10:00", "08:00", "06:00", "04:00", "02:00"];
const PX_PER_HOUR = 20;
type RenderedFrontEntry = {
  entry: FrontEntry;
  member: Member;
  row: number;
  column: number;
  height: number;
};

@Component({
  selector: 'app-front-history-graphical-page',
  imports: [Loading, HistoricFrontEntry, DateRange],
  templateUrl: './front-history-graphical-page.html',
  styleUrl: './front-history-graphical-page.css',
})
export class FrontHistoryGraphicalPage {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  protected readonly selectedEntry = signal<FrontEntryId | null>(null);
  protected readonly historyRange = signal<SelectedDateRange | null>(null);
  protected readonly frontHistory = signal<FrontEntry[] | null>(null);
  protected readonly renderedHistory = computed(() => {
    let historyRange = this.historyRange();
    if (!historyRange) return null;

    let history = this.frontHistory();
    if (!history) return null;

    const members = this.localStorageService.members();

    const historyEndSplit = historyRange.end.split(/\D/);
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

      let endedAt: Date;
      if (entry.endedAt) {
        endedAt = new Date(Date.parse(entry.endedAt));
      } else {
        endedAt = new Date();
      }
      const daysDiff = Math.floor((historyTime - endedAt.getTime()) / 86400000);
      let row = Math.max((1440 - endedAt.getHours() * 60 - endedAt.getMinutes()) / (60 / PX_PER_HOUR) + daysDiff * PX_PER_HOUR * 24, 0);

      const startedAt = new Date(Date.parse(entry.startedAt));
      const startedDaysDiff = Math.floor((historyTime - Date.parse(entry.startedAt)) / 86400000);
      const startedRow = (1440 - startedAt.getHours() * 60 - startedAt.getMinutes()) / (60 / PX_PER_HOUR) + startedDaysDiff * PX_PER_HOUR * 24;
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
    const range = this.historyRange();
    if (!range) return [];

    const newestDate = Date.parse(range.end);
    const oldestDate = Date.parse(range.start);

    const days: string[] = [];
    for (let date = newestDate; date >= oldestDate; date -= 86400000) {
      days.push(this.settingsService.formatDate(date, 'Date'));
    }
    return days;
  });
  protected readonly width = computed(() => {
    const history = this.renderedHistory();
    if (!history) return 'calc(100% - 120px)';

    const maxColumn = history.reduce((max, entry) => Math.max(max, entry.column), 0);
    return `calc(100% + ${45 * maxColumn}px + 120px)`;
  });

  constructor() {
    effect(() => this.loadFrontHistory());
  }

  protected async loadFrontHistory() {
    const range = this.historyRange();
    if (range) {
      this.webService.getFrontHistoryInDateRange(range.start, range.end).then((frontHistory) => {
        this.frontHistory.set(frontHistory);
      });
    } else {
      this.frontHistory.set(null);
    }
  }

  protected changeHistoryRange(range: SelectedDateRange) {
    this.historyRange.set(range);
  }

  protected selectEntry(entry: FrontEntryId | null, event: PointerEvent) {
    event.stopImmediatePropagation();

    this.selectedEntry.set(entry);
  }

  protected readonly toColor = toColor;
  protected readonly openDialog = openDialog;
}
