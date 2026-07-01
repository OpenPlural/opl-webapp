import {Folder, FolderId} from '../services/model/Folder';

export function compareCustomSort(a: {sort: bigint}, b: {sort: bigint}): number {
  return parseInt((a.sort - b.sort).toString());
}

export function sortNestedFolders(folders: Folder[]): Folder[] {
  return folders.sort((a, b) => {
    const aPath = getFolderPath(a, folders);
    const bPath = getFolderPath(b, folders);
    return aPath.localeCompare(bPath);
  });
}

function getFolderPath(folder: Folder, folders: Folder[]): string {
  const ancestors: string[] = [folder.name];
  let current: Folder | undefined = folder;
  while (current?.parentId) {
    const parent: FolderId = current.parentId;
    current = folders.find((f) => f.id === parent);
    if (current) {
      ancestors.unshift(current.name);
    }
  }
  return ancestors.join("/");
}
