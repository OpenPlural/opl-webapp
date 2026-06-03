export type TokenId = bigint;

export interface SessionToken {
  id: TokenId;
  name: string;
  createdAt: string;
  lastUsedAt: string;
}
