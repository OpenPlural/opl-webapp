import { Component, input, OnInit, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { VerticalCenter } from '../vertical-center/vertical-center';

@Component({
  selector: 'app-toggle-setting',
  imports: [TranslatePipe, VerticalCenter],
  templateUrl: './toggle-setting.html',
})
export class ToggleSetting implements OnInit {
  readonly name = input.required<string>();
  readonly toggled = input.required<boolean>();
  readonly toggle = output<boolean>();

  protected readonly toggleStatus = signal<boolean>(false);

  ngOnInit() {
    this.toggleStatus.set(this.toggled());
  }

  protected changeStatus() {
    this.toggleStatus.update(b => !b);
    this.toggle.emit(this.toggleStatus());
  }
}
