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
import {FrontHistoryPage} from '../pages/app/front-history-page/front-history-page';
import {ApiKeys} from '../pages/app/api-keys/api-keys';
import {DataImportExport} from '../pages/app/data-import-export/data-import-export';
import {DataImport} from '../pages/app/data-import/data-import';
import {DataExport} from '../pages/app/data-export/data-export';
import {MassDelete} from '../pages/app/mass-delete/mass-delete';
import {ResetPassword} from '../pages/reset-password/reset-password';
import { Social } from '../pages/app/social/social';

export const appRoutes: Routes = [
  {
    path: '',
    component: Dashboard,
    data: { name: 'navigation.dashboard', titleName: 'app.name', navigable: true }
  }, {
    path: 'members',
    component: Members,
    data: { name: 'navigation.members', custom: false, systemNavigable: true }
  }, {
    path: 'fronters',
    component: Fronters,
    data: { name: 'navigation.fronters' }
  }, {
    path: 'custom-front',
    component: Members,
    data: { name: 'navigation.customFront', custom: true }
  }, {
    path: 'folder/:id',
    component: FolderPage
  }, {
    path: 'member/:id',
    component: MemberPage
  }, {
    path: 'front-history',
    component: FrontHistoryPage,
    data: { name: 'navigation.frontHistory', systemNavigable: true }
  }, {
    path: 'friends',
    component: Friends,
    data: { name: 'navigation.friends', navigable: true }
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
    data: { name: 'navigation.privacyBuckets', systemNavigable: true }
  }, {
    path: 'privacy-bucket/:id',
    component: PrivacyBucketPage
  }, {
    path: 'custom-fields',
    component: CustomFields,
    data: { name: 'navigation.customFields', systemNavigable: true }
  }, {
    path: 'custom-field/:id',
    component: CustomFieldPage
  }, {
    path: 'api-keys',
    component: ApiKeys,
    data: { name: 'navigation.apiKeys' }
  }, {
    path: 'sessions',
    component: Sessions,
    data: { name: 'navigation.sessions' }
  }, {
    path: 'account-settings',
    component: AccountSettings,
    data: { name: 'navigation.accountSettings' }
  }, {
    path: 'options',
    component: Options,
    data: { name: 'navigation.options' }
  }, {
    path: 'data-import-export',
    component: DataImportExport,
    data: { name: 'navigation.dataImportExport' }
  }, {
    path: 'data-import/simplyPlural',
    component: DataImport,
    data: { name: 'navigation.dataImport', format: 'simplyPlural' }
  }, {
    path: 'data-import/openPlural',
    component: DataImport,
    data: { name: 'navigation.dataImport', format: 'openPlural' }
  }, {
    path: 'data-export/openPlural',
    component: DataExport,
    data: { name: 'navigation.dataExport', format: 'openPlural' }
  }, {
    path: 'mass-delete',
    component: MassDelete,
    data: { name: 'navigation.massDelete' }
  }, {
    path: 'social',
    component: Social,
    data: { name: 'navigation.social' }
  }, {
    path: 'legal',
    component: Legal,
    data: { name: 'navigation.legal' }
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
      }, {
        path: 'reset-password',
        component: ResetPassword
      }
    ]
  }
];
