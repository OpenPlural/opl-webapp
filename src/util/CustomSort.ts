export function compareCustomSort(a: {sort: bigint}, b: {sort: bigint}): number {
  return parseInt((a.sort - b.sort).toString());
}
