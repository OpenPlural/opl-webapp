import { Component, input, OnInit, output, signal } from '@angular/core';
import { VerticalCenter } from '../vertical-center/vertical-center';

@Component({
  selector: 'app-date-range',
  imports: [VerticalCenter],
  templateUrl: './date-range.html',
})
export class DateRange implements OnInit {
  readonly initialPeriod = input.required<number>();
  readonly dateRangeSelected = output<SelectedDateRange>();

  protected readonly start = signal<string | null>(null);
  protected readonly end = signal<string | null>(null);

  ngOnInit() {
    const end = new Date(Date.now() + 86400000);
    const start = new Date(Date.now() - this.initialPeriod());
    this.start.set(start.toISOString().split('T')[0]);
    this.end.set(end.toISOString().split('T')[0]);
    this.emitDateRange();
  }

  protected changeStart(event: Event) {
    const input = event.target as HTMLInputElement;
    this.start.set(input.value || null);
    this.emitDateRange();
  }

  protected changeEnd(event: Event) {
    const input = event.target as HTMLInputElement;
    this.end.set(input.value || null);
    this.emitDateRange();
  }

  private emitDateRange() {
    const start = this.start();
    const end = this.end();
    if (start && end) {
      this.dateRangeSelected.emit({ start, end });
    }
  }
}

export type SelectedDateRange = {
  start: string;
  end: string;
};
