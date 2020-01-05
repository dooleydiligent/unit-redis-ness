import { RedisToken } from '../resp/protocol/redis-token';

export abstract class Session {
  public abstract getId(): string;
  public abstract getName(): string;
  public abstract setName(name: string): void;
  public abstract publish(message: RedisToken): void;
  public abstract close(): void;
  public abstract destroy(): void;
  public abstract getValue(key: string): any;
  public abstract putValue(key: string, value: any): void;
  public abstract removeValue(key: string): any;
  public abstract getAddress(): string;
  public abstract getCurrentDb(): number;
  public abstract setCurrentDb(db: number): void;
  public abstract getLastCommand(): string;
  public abstract setLastCommand(command: string): void;
}
