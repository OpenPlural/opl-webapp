import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-misrouted',
  imports: [TranslatePipe],
  templateUrl: './misrouted.html',
  styleUrl: './misrouted.css',
})
export class Misrouted {
  private readonly location = inject(Location);

  protected goBack() {
    this.location.back();
  }
}
