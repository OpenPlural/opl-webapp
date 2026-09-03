import { MemberId } from './Member';
import { truncateCurrentDate } from '../../util/DateTruncate';
import { generateLocalId } from '../../util/IdGenerator';
import { FolderId } from './Folder';

export type PhotoAlbumId = bigint;

export interface PhotoAlbum {
  id: PhotoAlbumId;
  remoteId: PhotoAlbumId | null;
  memberId: MemberId;
  sort: bigint;
  name: string;
  description: string | null;
  photoUrls: string[] | null;
  updatedAt: string;
}

export function makePhotoAlbum(name: string, memberId: MemberId, sort: bigint): PhotoAlbum {
  const currentDate = truncateCurrentDate();
  return {
    id: generateLocalId(),
    remoteId: null,
    memberId,
    sort,
    name,
    description: null,
    photoUrls: null,
    updatedAt: currentDate
  };
}
