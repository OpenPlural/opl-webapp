import { Component } from '@angular/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-legal',
  imports: [
    NavPageContainer,
    TranslatePipe
  ],
  templateUrl: './legal.html',
})
export class Legal {}
