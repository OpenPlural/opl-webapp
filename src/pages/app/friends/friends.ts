import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { WebService } from '../../../services/WebService';
import { UserListItem } from '../../../components/list-item/user-list-item/user-list-item';
import { Friend, FriendRequest } from '../../../services/model/Friend';
import { Router } from '@angular/router';
import { UserId } from '../../../services/model/User';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { Loading } from '../../../components/loading/loading';
import { TranslatePipe } from '@ngx-translate/core';
import { PopupInput } from '../../../components/popup-input/popup-input';
import { ProfilePicture } from '../../../components/profile-picture/profile-picture';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { openDialog } from '../../../util/CommonFunctions';

@Component({
  selector: 'app-friends',
  imports: [
    NavPageContainer,
    UserListItem,
    Pager,
    ToggleIconButton,
    Loading,
    TranslatePipe,
    PopupInput,
    ProfilePicture,
    VerticalCenter,
  ],
  templateUrl: './friends.html',
})
export class Friends implements OnInit {
  private readonly router = inject(Router);
  private readonly webService = inject(WebService);

  protected readonly friends = signal<Friend[] | null>(null);
  protected readonly incomingRequests = signal<FriendRequest[] | null>(null);
  protected readonly outgoingRequests = signal<FriendRequest[] | null>(null);
  protected readonly selectedTab = signal<'friends' | 'friendRequests'>('friends');

  constructor() {
    effect(() => {
      const tab = this.selectedTab();
      if (tab === 'friendRequests') {
        this.loadIncomingFriendRequests();
        this.loadOutgoingFriendRequests();
      } else {
        this.incomingRequests.set(null);
        this.outgoingRequests.set(null);
      }
    });
  }

  ngOnInit() {
    this.loadFriends();
  }

  protected gotoFriend(id: UserId) {
    this.router.navigate(['app', 'friend', id]);
  }

  protected loadFriends() {
    this.webService.getFriends().then((friends) => {
      this.friends.set(friends.sort((a, b) => a.user.name.localeCompare(b.user.name)));
    });
  }

  protected loadIncomingFriendRequests() {
    this.webService.getIncomingFriendRequests().then((requests) => {
      this.incomingRequests.set(requests.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }

  protected loadOutgoingFriendRequests() {
    this.webService.getOutgoingFriendRequests().then((requests) => {
      this.outgoingRequests.set(requests.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }

  protected async sendFriendRequest(friendCode: string) {
    await this.webService.sendFriendRequest(friendCode);
    this.loadOutgoingFriendRequests();
  }

  protected async cancelFriendRequest(friendCode: string) {
    await this.webService.cancelFriendRequest(friendCode);
    this.outgoingRequests.update(
      (requests) => requests?.filter((req) => req.code !== friendCode) || null,
    );
  }

  protected async acceptFriendRequest(friendCode: string) {
    await this.webService.acceptFriendRequest(friendCode);
    this.incomingRequests.update(
      (requests) => requests?.filter((req) => req.code !== friendCode) || null,
    );
    this.loadFriends();
  }

  protected async declineFriendRequest(friendCode: string) {
    await this.webService.declineFriendRequest(friendCode);
    this.incomingRequests.update(
      (requests) => requests?.filter((req) => req.code !== friendCode) || null,
    );
  }

  protected readonly openDialog = openDialog;
}
