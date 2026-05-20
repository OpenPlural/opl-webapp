import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard-button',
  imports: [TranslatePipe],
  templateUrl: './dashboard-button.html',
  styleUrl: './dashboard-button.css',
})
export class DashboardButton {
  readonly name = input.required<string>();
  readonly icon = input.required<string>();
  readonly link = input.required<string>();
  readonly disabled = input<boolean>(false);

  private readonly router = inject(Router);

  gotoLink() {
    this.router.navigate(["app", this.link()]);
  }
}
