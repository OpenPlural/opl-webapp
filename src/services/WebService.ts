import { inject, Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ExtendedUserInfo, UserId, UserInfo } from './model/User';
import { Folder, FolderId } from './model/Folder';
import { ExtendedMember, Member, MemberId } from './model/Member';
import { AccountInfo } from './model/Auth';
import { firstValueFrom } from 'rxjs';
import { FrontEntry, FrontEntryId } from './model/Front';
import { SyncData } from './model/Sync';
import { Friend, FriendRequest, FriendSettings } from './model/Friend';
import { PrivacyBucket, PrivacyBucketId, SimplePrivacyBucket } from './model/Privacy';
import {
  CustomField,
  CustomFieldDataId,
  CustomFieldDataValue,
  CustomFieldId,
  ViewedCustomFieldDataValue
} from './model/Field';
import { Session, SessionId } from './model/Session';
import {
  translateCustomFieldDataValue,
  translateFolder,
  translateFrontEntry,
  translateMember, translatePrivacyBucket
} from '../util/IdTranslator';
import { LocalStorageService } from './LocalStorageService';
import {ApiKey, ApiKeyId} from './model/ApiKey';

const BASE_URL: string = localStorage.getItem('baseUrl') || (isDevMode() ? 'https://localhost:4200' : 'https://opl-api.webbiii.cc');

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

  async sync(since: Date, absolute: boolean): Promise<SyncData> {
    return firstValueFrom(this.http.get<SyncData>(`${BASE_URL}/api/v1/sync/?since=${since.toISOString()}&absolute=${absolute}`));
  }

  async createFolder(folder: Folder): Promise<FolderId> {
    folder = translateFolder(this.localStorageService, [folder], folder, 'remoteId');
    return firstValueFrom(this.http.put<IdResponse>(`${BASE_URL}/api/v1/folder/`, folder)).then(res => res.id);
  }

  async deleteFolder(remoteId: FolderId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/folder/${remoteId}`));
  }

  async updateFolder(folder: Folder): Promise<void> {
    folder = translateFolder(this.localStorageService, [folder], folder, 'remoteId');
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/folder/${folder.remoteId}`, folder));
  }

  async createMember(member: Member): Promise<MemberId> {
    member = translateMember(this.localStorageService, member, 'remoteId');
    return firstValueFrom(this.http.put<IdResponse>(`${BASE_URL}/api/v1/member/`, member)).then(res => res.id);
  }

  async deleteMember(remoteId: MemberId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/member/${remoteId}`));
  }

  async updateMember(member: Member): Promise<void> {
    member = translateMember(this.localStorageService, member, 'remoteId');
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/member/${member.remoteId}`, member));
  }

  async updateMemberFolders(member: Member): Promise<void> {
    member = translateMember(this.localStorageService, member, 'remoteId');
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/member/${member.remoteId}/folders`, member.folders));
  }

  async createFrontEntry(frontEntry: FrontEntry): Promise<FrontEntryId> {
    frontEntry = translateFrontEntry(this.localStorageService, frontEntry, 'remoteId');
    return firstValueFrom(this.http.put<IdResponse>(`${BASE_URL}/api/v1/front/`, frontEntry)).then(res => res.id);
  }

  async deleteFrontEntry(remoteId: FrontEntryId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/front/${remoteId}`));
  }

  async updateFrontEntry(frontEntry: FrontEntry, useRemoteId: boolean = true): Promise<void> {
    frontEntry = translateFrontEntry(this.localStorageService, frontEntry, 'remoteId');
    const id = useRemoteId ? frontEntry.remoteId : frontEntry.id;
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/front/${id}`, frontEntry));
  }

  async createCustomField(customField: CustomField): Promise<CustomFieldId> {
    return firstValueFrom(this.http.put<IdResponse>(`${BASE_URL}/api/v1/field/`, customField)).then(res => res.id);
  }

  async deleteCustomField(remoteId: CustomFieldId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/field/${remoteId}`));
  }

  async updateCustomField(customField: CustomField): Promise<void> {
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/field/${customField.remoteId}`, customField));
  }

  async reorderCustomFields(ids: CustomFieldId[]): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/api/v1/field/reorder`, ids));
  }

  async createCustomFieldValue(customFieldValue: CustomFieldDataValue): Promise<CustomFieldDataId> {
    customFieldValue = translateCustomFieldDataValue(this.localStorageService, customFieldValue, 'remoteId');
    return firstValueFrom(this.http.put<IdResponse>(`${BASE_URL}/api/v1/field/value/`, customFieldValue)).then(res => res.id);
  }

  async deleteCustomFieldValue(remoteId: CustomFieldDataId): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/api/v1/field/value/${remoteId}`));
  }

  async updateCustomFieldValue(customFieldValue: CustomFieldDataValue): Promise<void> {
    customFieldValue = translateCustomFieldDataValue(this.localStorageService, customFieldValue, 'remoteId');
    await firstValueFrom(this.http.patch(`${BASE_URL}/api/v1/field/value/${customFieldValue.remoteId}`, customFieldValue));
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

  async getMemberCustomFields(userId: UserId, memberId: MemberId): Promise<ViewedCustomFieldDataValue[]> {
    return firstValueFrom(this.http.get<ViewedCustomFieldDataValue[]>(`${BASE_URL}/api/v1/member/${memberId}/fields?userId=${userId}`));
  }

  async getMemberWithFolders(userId: UserId, memberId: MemberId): Promise<ExtendedMember> {
    return firstValueFrom(this.http.get<ExtendedMember>(`${BASE_URL}/api/v1/member/${memberId}?userId=${userId}&extended=true`));
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
}

interface IdResponse {
  id: bigint;
}
