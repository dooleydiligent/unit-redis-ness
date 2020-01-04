
export interface IRedisSource {
  available(): number;
  readLine(): string;
  readString(length: number): string;
}
