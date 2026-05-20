import { generateLocalId } from '../../util/IdGenerator';
import { truncateCurrentDate } from '../../util/DateTruncate';

export type FolderId = bigint;

export interface Folder {
  id: FolderId;
  remoteId: FolderId | null;
  parentId: FolderId | null;
  name: string;
  description: string | null;
  emoji: string | null;
  color: bigint;
  createdAt: string;
  updatedAt: string;
}

export function makeFolder(name: string, parentId: FolderId | null): Folder {
  const currentDate = truncateCurrentDate();
  return {
    id: generateLocalId(),
    remoteId: null,
    parentId,
    name,
    description: null,
    emoji: null,
    color: 16777215n,
    createdAt: currentDate,
    updatedAt: currentDate
  };
}
