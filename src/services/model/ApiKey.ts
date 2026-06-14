export type ApiKeyId = bigint;

export interface ApiKey {
  id: ApiKeyId;
  token: string | undefined;
  name: string;
  write: boolean;
  createdAt: string | undefined;
}
