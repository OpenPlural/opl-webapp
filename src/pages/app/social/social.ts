import { Component } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-social',
  imports: [NavPageContainer, TranslatePipe],
  templateUrl: './social.html',
})
export class Social {}
