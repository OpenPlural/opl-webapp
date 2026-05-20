import { Component, computed, input, OnInit, output, signal } from '@angular/core';
import { toColor } from '../../../util/ColorConvert';
import { VerticalCenter } from '../../vertical-center/vertical-center';
import { IconButton } from '../../icon-button/icon-button';

@Component({
  selector: 'app-list-item',
  imports: [VerticalCenter],
  templateUrl: './list-item.html',
  styleUrl: './list-item.css',
})
export class ListItem implements OnInit {
  readonly color = input.required<bigint>();
  readonly containerClass = input<string>('');
  readonly buttonClass = input<string>('');
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly selectionStatus = output<boolean>();
  readonly action = output();

  protected readonly cssColor = computed(() => toColor(this.color()));
  protected readonly selection = signal<boolean>(false);

  ngOnInit() {
    this.selection.set(this.selected());
  }

  protected toggleSelection() {
    this.selection.update((b) => !b);
    this.selectionStatus.emit(this.selection());
  }
}
