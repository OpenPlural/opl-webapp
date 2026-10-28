import { inject, Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ExtendedUserInfo, UserId, UserInfo } from './model/User';
import { Folder } from './model/Folder';
import { ExtendedMember, Member, MemberId } from './model/Member';
import { AccountInfo } from './model/Auth';
import { firstValueFrom } from 'rxjs';
import { FrontEntry, FrontEntryId } from './model/Front';
import {
  FrontSyncRequest,
  FrontSyncResponse,
  SyncRequest,
  SyncResponse,
} from './model/Sync';
import { Friend, FriendRequest, FriendSettings } from './model/Friend';
import { PrivacyBucket, PrivacyBucketId, SimplePrivacyBucket } from './model/Privacy';
import {
  CustomField,
  ViewedCustomFieldDataValue
} from './model/Field';
import { Session, SessionId } from './model/Session';
import {
  translateFrontEntry,
  translatePrivacyBucket
} from '../util/IdTranslator';
import { LocalStorageService } from './LocalStorageService';
import {ApiKey, ApiKeyId} from './model/ApiKey';
import { Analytics } from './model/Analytics';
import { PhotoAlbum } from './model/Gallery';
import { UploadResponse } from './model/Cdn';
import { PkConfig } from './model/PluralKit';

export const BASE_URL: string = localStorage.getItem('baseUrl') || (isDevMode() ? 'https://localhost:4200' : 'https://opl-api.webbiii.cc');

@Injectable({providedIn: 'root'})
export class WebService {
  private readonly http = inject(HttpClient);
  private readonly localStorageService = inject(LocalStorageService);

  async getNewestVersion(): Promise<string> {
    const update = await firstValueFrom(this.http.get<{version: string}>(`${BASE_URL}/app-update`));
    return update.version;
  }

  async register(username: string, password: string, system: boolean): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/auth/register`, { name: username, password, system }));
  }

  async login(username: string, password: string): Promise<AccountInfo> {
    const device = navigator.userAgent;

    return firstValueFrom(this.http.post<AccountInfo>(`${BASE_URL}/auth/login`, { name: username, password, device }));
  }

  async initVirtualSession(): Promise<AccountInfo> {
    return firstValueFrom(this.http.get<AccountInfo>(`${BASE_URL}/api/v1/session/virtual`));
  }

  async deleteAccount(id: UserId, password: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/auth/delete-account`, { id, password }));
  }

  async changePassword(id: UserId, oldPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/auth/change-password`, { id, oldPassword, newPassword }));
  }

  async resetPassword(username: string, resetToken: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/auth/reset-password`, { name: username, resetToken, newPassword }));
  }

  async getSessions(): Promise<Session[]> {
    return firstValueFrom(this.http.get<Session[]>(`${BASE_URL}/api/v1/session/`));
  }

  async invalidateSession(id: SessionId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/session/${id}`));
  }

  async invalidateCurrentSession(): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/session/self`));
  }

  async sync(request: SyncRequest): Promise<SyncResponse> {
    return firstValueFrom(this.http.post<SyncResponse>(`${BASE_URL}/api/v2/sync/`, request));
  }

  async syncFront(request: FrontSyncRequest): Promise<FrontSyncResponse> {
    return firstValueFrom(this.http.post<FrontSyncResponse>(`${BASE_URL}/api/v2/sync/front`, request));
  }

  async deleteFrontEntry(remoteId: FrontEntryId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/front/${remoteId}`));
  }

  async updateFrontEntry(frontEntry: FrontEntry, useRemoteId: boolean = true): Promise<void> {
    frontEntry = translateFrontEntry(this.localStorageService, frontEntry, 'remoteId');
    const id = useRemoteId ? frontEntry.remoteId : frontEntry.id;
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/front/${id}`, frontEntry));
  }

  async createPrivacyBucket(privacyBucket: PrivacyBucket): Promise<PrivacyBucketId> {
    privacyBucket = translatePrivacyBucket(this.localStorageService, privacyBucket, 'remoteId');
    return firstValueFrom(this.http.put<IdResponse>(`${BASE_URL}/api/v1/privacy/`, privacyBucket)).then(res => res.id);
  }

  async deletePrivacyBucket(privacyBucketId: PrivacyBucketId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/privacy/${privacyBucketId}`));
  }

  async updatePrivacyBucket(privacyBucket: PrivacyBucket): Promise<void> {
    privacyBucket = translatePrivacyBucket(this.localStorageService, privacyBucket, 'remoteId');
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/privacy/${privacyBucket.id}`, privacyBucket))
  }

  async reorderPrivacyBuckets(ids: PrivacyBucketId[]): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/privacy/reorder`, ids));
  }

  async getPrivacyBuckets(): Promise<PrivacyBucket[]> {
    const buckets = await firstValueFrom(this.http.get<PrivacyBucket[]>(`${BASE_URL}/api/v1/privacy/`));
    return buckets.map((bucket) => translatePrivacyBucket(this.localStorageService, bucket, 'id'));
  }

  async getPrivacyBucket(id: PrivacyBucketId): Promise<PrivacyBucket> {
    const bucket = await firstValueFrom(this.http.get<PrivacyBucket>(`${BASE_URL}/api/v1/privacy/${id}`));
    return translatePrivacyBucket(this.localStorageService, bucket, 'id');
  }

  async setFolderPrivacy(ids: PrivacyBucketId[], folder: Folder): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/folder/${folder.remoteId}/privacy`, ids));
  }

  async addPrivacyBucketFolder(privacyBucketId: PrivacyBucketId, folder: Folder): Promise<SimplePrivacyBucket> {
    return firstValueFrom(this.http.put<SimplePrivacyBucket>(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/folder/${folder.remoteId}`, {}));
  }

  async addPrivacyBucketMember(privacyBucketId: PrivacyBucketId, member: Member): Promise<SimplePrivacyBucket> {
    return firstValueFrom(this.http.put<SimplePrivacyBucket>(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/member/${member.remoteId}`, {}));
  }

  async addPrivacyBucketCustomField(privacyBucketId: PrivacyBucketId, field: CustomField): Promise<SimplePrivacyBucket> {
    return firstValueFrom(this.http.put<SimplePrivacyBucket>(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/field/${field.remoteId}`, {}));
  }

  async addPrivacyBucketPhotoAlbum(privacyBucketId: PrivacyBucketId, album: PhotoAlbum): Promise<SimplePrivacyBucket> {
    return firstValueFrom(this.http.put<SimplePrivacyBucket>(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/gallery/${album.remoteId}`, {}));
  }

  async addPrivacyBucketFriend(privacyBucketId: PrivacyBucketId, friendId: UserId): Promise<SimplePrivacyBucket> {
    return firstValueFrom(this.http.put<SimplePrivacyBucket>(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/friend/${friendId}`, {}));
  }

  async removePrivacyBucketFolder(privacyBucketId: PrivacyBucketId, folder: Folder): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/folder/${folder.remoteId}`));
  }

  async removePrivacyBucketMember(privacyBucketId: PrivacyBucketId, member: Member): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/member/${member.remoteId}`));
  }

  async removePrivacyBucketCustomField(privacyBucketId: PrivacyBucketId, field: CustomField): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/field/${field.remoteId}`));
  }

  async removePrivacyBucketPhotoAlbum(privacyBucketId: PrivacyBucketId, album: PhotoAlbum): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/gallery/${album.remoteId}`));
  }

  async removePrivacyBucketFriend(privacyBucketId: PrivacyBucketId, friendId: UserId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/privacy/${privacyBucketId}/friend/${friendId}`));
  }

  async getFolderPrivacy(folder: Folder): Promise<SimplePrivacyBucket[]> {
    return firstValueFrom(this.http.get<SimplePrivacyBucket[]>(`${BASE_URL}/api/v1/folder/${folder.remoteId}/privacy`));
  }

  async getMemberPrivacy(member: Member): Promise<SimplePrivacyBucket[]> {
    return firstValueFrom(this.http.get<SimplePrivacyBucket[]>(`${BASE_URL}/api/v1/member/${member.remoteId}/privacy`));
  }

  async getCustomFieldPrivacy(field: CustomField): Promise<SimplePrivacyBucket[]> {
    return firstValueFrom(this.http.get<SimplePrivacyBucket[]>(`${BASE_URL}/api/v1/field/${field.remoteId}/privacy`));
  }

  async getPhotoAlbumPrivacy(album: PhotoAlbum): Promise<SimplePrivacyBucket[]> {
    return firstValueFrom(this.http.get<SimplePrivacyBucket[]>(`${BASE_URL}/api/v1/member/${album.memberId}/gallery/${album.remoteId}/privacy`));
  }

  async getFriendPrivacy(friendId: UserId): Promise<SimplePrivacyBucket[]> {
    return firstValueFrom(this.http.get<SimplePrivacyBucket[]>(`${BASE_URL}/api/v1/friend/${friendId}/privacy`));
  }

  async getFriendSettings(friendId: UserId): Promise<FriendSettings> {
    return firstValueFrom(this.http.get<FriendSettings>(`${BASE_URL}/api/v1/friend/${friendId}/settings`));
  }

  async updateFriendSettings(friendId: UserId, settings: FriendSettings): Promise<void> {
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/friend/${friendId}/settings`, settings));
  }

  async getFriends(): Promise<Friend[]> {
    return firstValueFrom(this.http.get<Friend[]>(`${BASE_URL}/api/v1/friend/`));
  }

  async getIncomingFriendRequests(): Promise<FriendRequest[]> {
    return firstValueFrom(this.http.get<FriendRequest[]>(`${BASE_URL}/api/v1/friend/requests/incoming`));
  }

  async getOutgoingFriendRequests(): Promise<FriendRequest[]> {
    return firstValueFrom(this.http.get<FriendRequest[]>(`${BASE_URL}/api/v1/friend/requests/outgoing`));
  }

  async sendFriendRequest(friendCode: string): Promise<void> {
    await firstValueFrom(this.http.put(`${BASE_URL}/api/v1/friend/requests/${friendCode}`, {}));
  }

  async cancelFriendRequest(friendCode: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/friend/requests/${friendCode}`, {}));
  }

  async acceptFriendRequest(friendCode: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/friend/requests/${friendCode}/accept`, {}));
  }

  async declineFriendRequest(friendCode: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/friend/requests/${friendCode}/decline`, {}));
  }

  async unfriend(friendId: UserId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/friend/${friendId}`));
  }

  async updateUser(user: UserInfo): Promise<void> {
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/user/self`, user));
  }

  async getUser(id: UserId): Promise<ExtendedUserInfo> {
    return firstValueFrom(this.http.get<ExtendedUserInfo>(`${BASE_URL}/api/v1/user/${id}`));
  }

  async getUsername(id: UserId): Promise<string> {
    return firstValueFrom(this.http.get<string>(`${BASE_URL}/api/v1/user/${id}/name`));
  }

  async changeFriendCode(): Promise<string> {
    const res = await firstValueFrom(this.http.post<{ friendCode: string }>(`${BASE_URL}/api/v1/user/change-friend-code`, {}));
    return res.friendCode;
  }

  async getFrontHistory(page: number): Promise<FrontEntry[]> {
    const frontEntries = await firstValueFrom(this.http.get<FrontEntry[]>(`${BASE_URL}/api/v1/front/history?page=${page}`));
    return frontEntries.map((frontEntry) => translateFrontEntry(this.localStorageService, frontEntry, 'id'));
  }

  async getFrontHistoryInDateRange(startDate: string, endDate: string): Promise<FrontEntry[]> {
    const frontEntries = await firstValueFrom(this.http.get<FrontEntry[]>(`${BASE_URL}/api/v1/front/history/by-date?start=${startDate}&end=${endDate}`));
    return frontEntries.map((frontEntry) => translateFrontEntry(this.localStorageService, frontEntry, 'id'));
  }

  async getMemberFrontHistory(member: Member, page: number): Promise<FrontEntry[]> {
    const frontEntries = await firstValueFrom(this.http.get<FrontEntry[]>(`${BASE_URL}/api/v1/member/${member.remoteId}/front-history?page=${page}`));
    return frontEntries.map((frontEntry) => translateFrontEntry(this.localStorageService, frontEntry, 'id'));
  }

  async getMemberGallery(userId: UserId, memberId: MemberId): Promise<PhotoAlbum[]> {
    return firstValueFrom(this.http.get<PhotoAlbum[]>(`${BASE_URL}/api/v1/member/${memberId}/gallery?userId=${userId}`));
  }

  async getMemberCustomFields(userId: UserId, memberId: MemberId): Promise<ViewedCustomFieldDataValue[]> {
    return firstValueFrom(this.http.get<ViewedCustomFieldDataValue[]>(`${BASE_URL}/api/v1/member/${memberId}/fields?userId=${userId}`));
  }

  async getMemberWithFolders(userId: UserId, memberId: MemberId): Promise<ExtendedMember> {
    return firstValueFrom(this.http.get<ExtendedMember>(`${BASE_URL}/api/v1/member/${memberId}?userId=${userId}&extended=true`));
  }

  async getAnalytics(startDate: string, endDate: string): Promise<Analytics> {
    return firstValueFrom(this.http.get<Analytics>(`${BASE_URL}/api/v1/analytics/?start=${startDate}&end=${endDate}`));
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return firstValueFrom(this.http.get<ApiKey[]>(`${BASE_URL}/api/v1/api-key/`));
  }

  async createApiKey(name: string, write: boolean): Promise<ApiKey> {
    return firstValueFrom(this.http.put<ApiKey>(`${BASE_URL}/api/v1/api-key/`, { name, write }));
  }

  async deleteApiKey(id: ApiKeyId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/api-key/${id}`));
  }

  async subscribeToNotifications(subscription: PushSubscription) {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/notification/subscribe`, subscription.toJSON()));
  }

  async import(data: any) {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/import/`, data));
  }

  async export(): Promise<any> {
    return firstValueFrom(this.http.post(`${BASE_URL}/api/v1/export/`, {}));
  }

  async uploadToCdn(bytes: ArrayBuffer, type: string): Promise<string> {
    const res = await firstValueFrom(this.http.post<UploadResponse>(`${BASE_URL}/api/v1/cdn/upload`, bytes));
    return `:cdn:${res.id}:${type}:${res.access}`;
  }

  async getPkConfig(): Promise<PkConfig> {
    return firstValueFrom(this.http.get<PkConfig>(`${BASE_URL}/api/v1/pluralkit/`));
  }

  async updatePkConfig(config: PkConfig): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/pluralkit/`, config));
  }

  async syncPk(direction: 'Push' | 'Pull') {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/pluralkit/sync?direction=${direction}`, {}));
  }
}

interface IdResponse {
  id: bigint;
}
