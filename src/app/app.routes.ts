import { Routes } from '@angular/router';
import { Dashboard } from '../pages/app/dashboard/dashboard';
import { Login } from '../pages/login/login';
import { loginGuard, notLoggedInGuard } from '../guards/login.guard';
import { Register } from '../pages/register/register';
import { Members } from '../pages/app/members/members';
import { FolderPage } from '../pages/app/folder-page/folder-page';
import { MemberPage } from '../pages/app/member-page/member-page';
import { Fronters } from '../pages/app/fronters/fronters';
import { Friends } from '../pages/app/friends/friends';
import { FriendPage } from '../pages/app/friend-page/friend-page';
import { FriendMemberPage } from '../pages/app/friend-member-page/friend-member-page';
import { PrivacyBuckets } from '../pages/app/privacy-buckets/privacy-buckets';
import { PrivacyBucketPage } from '../pages/app/privacy-bucket-page/privacy-bucket-page';
import { FriendSettingsPage } from '../pages/app/friend-settings-page/friend-settings-page';
import { CustomFields } from '../pages/app/custom-fields/custom-fields';
import { CustomFieldPage } from '../pages/app/custom-field-page/custom-field-page';
import { Options } from '../pages/app/options/options';
import { AccountSettings } from '../pages/app/account-settings/account-settings';
import {Legal} from '../pages/app/legal/legal';
import {Setup} from '../pages/app/setup/setup';
import {Sessions} from '../pages/app/sessions/sessions';

export const appRoutes: Routes = [
  {
    path: '',
    component: Dashboard,
    data: { name: 'dashboard', titleName: 'opl', navigable: true }
  }, {
    path: 'members',
    component: Members,
    data: { name: 'members', custom: false, navigable: true }
  }, {
    path: 'fronters',
    component: Fronters,
    data: { name: 'fronters' }
  }, {
    path: 'custom-front',
    component: Members,
    data: { name: 'custom front', custom: true }
  }, {
    path: 'folder/:id',
    component: FolderPage
  }, {
    path: 'member/:id',
    component: MemberPage
  }, {
    path: 'friends',
    component: Friends,
    data: { name: 'friends', navigable: true }
  }, {
    path: 'friend/:id',
    component: FriendPage
  }, {
    path: 'friend/:id/settings',
    component: FriendSettingsPage
  }, {
    path: 'friend/:userId/member/:memberId',
    component: FriendMemberPage
  }, {
    path: 'privacy-buckets',
    component: PrivacyBuckets,
    data: { name: 'privacy buckets', navigable: true }
  }, {
    path: 'privacy-bucket/:id',
    component: PrivacyBucketPage
  }, {
    path: 'custom-fields',
    component: CustomFields,
    data: { name: 'custom fields', navigable: true }
  }, {
    path: 'custom-field/:id',
    component: CustomFieldPage
  }, {
    path: 'sessions',
    component: Sessions,
    data: { name: 'sessions' }
  }, {
    path: 'account-settings',
    component: AccountSettings,
    data: { name: 'account settings' }
  }, {
    path: 'options',
    component: Options,
    data: { name: 'options' }
  }, {
    path: 'legal',
    component: Legal,
    data: { name: 'legal' }
  }, {
    path: 'setup',
    component: Setup
  }
];
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app'
  },
  {
    path: 'app',
    canActivate: [loginGuard()],
    children: appRoutes
  }, {
    path: 'auth',
    canActivate: [() => {notLoggedInGuard()}],
    children: [
      {
        path: 'login',
        component: Login
      }, {
        path: 'register',
        component: Register
      }
    ]
  }
];
