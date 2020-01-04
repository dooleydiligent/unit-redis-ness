import { RedisToken } from '../resp/protocol/redis-token';

export abstract class Session {
  public abstract getId(): string;
  public abstract publish(message: RedisToken): void;
  public abstract close(): void;
  public abstract destroy(): void;
  public abstract getValue(key: string): any;
  public abstract putValue(key: string, value: any): void;
  public abstract removeValue(key: string): any;
}
