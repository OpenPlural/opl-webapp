export type SessionId = bigint;

export interface Session {
  id: SessionId;
  name: string;
  createdAt: string;
  lastUsedAt: string;
}
