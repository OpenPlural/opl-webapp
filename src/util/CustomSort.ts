import {Folder, FolderId} from '../services/model/Folder';

export function compareCustomSort(a: {sort: bigint; name: string}, b: {sort: bigint; name: string}): number {
  if (a.sort === b.sort) {
    return a.name.localeCompare(b.name);
  }
  return Number(a.sort - b.sort);
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
