import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {WebService} from '../../../services/WebService';
import {Session, SessionId} from '../../../services/model/Session';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {Loading} from '../../../components/loading/loading';
import {TranslatePipe} from '@ngx-translate/core';
import {SettingsService} from '../../../services/SettingsService';
import {VerticalCenter} from '../../../components/vertical-center/vertical-center';
import {IconButton} from '../../../components/icon-button/icon-button';
import {AccountService} from '../../../services/AccountService';

@Component({
  selector: 'app-sessions',
  imports: [
    NavPageContainer,
    Loading,
    TranslatePipe,
    VerticalCenter,
    IconButton
  ],
  templateUrl: './sessions.html',
})
export class Sessions implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  protected readonly sessions = signal<Session[] | null>(null);

  protected readonly currentSessionId = computed(() => this.accountService.account()?.session.id);

  ngOnInit() {
    this.webService.getSessions().then((sessions) => {
      this.sessions.set(sessions.sort((a, b) => parseInt((a.id - b.id).toString())));
    });
  }

  protected formatDate(date: string): string {
    return this.settingsService.formatDate(new Date(Date.parse(date)), "DateTime");
  }

  protected async invalidateSession(id: SessionId) {
    await this.webService.invalidateSession(id);
    this.sessions.update(sessions => sessions ? sessions.filter(s => s.id !== id) : null);
  }
}
