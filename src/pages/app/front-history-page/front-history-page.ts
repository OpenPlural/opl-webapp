import {Component, signal} from '@angular/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {Pager} from '../../../components/pager/pager';
import {ToggleIconButton} from '../../../components/toggle-icon-button/toggle-icon-button';
import {FrontHistoryTextualPage} from '../front-history-textual-page/front-history-textual-page';
import { FrontHistoryGraphicalPage } from '../front-history-graphical-page/front-history-graphical-page';

@Component({
  selector: 'app-front-history-page',
  imports: [
    NavPageContainer,
    Pager,
    ToggleIconButton,
    FrontHistoryTextualPage,
    FrontHistoryGraphicalPage,
  ],
  templateUrl: './front-history-page.html',
})
export class FrontHistoryPage {
  protected readonly selectedTab = signal<'graphical' | 'textual'>('graphical');
}
