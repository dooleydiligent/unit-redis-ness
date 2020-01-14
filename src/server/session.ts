import { IRespCommand } from '../resp/command/resp-command';
import { RedisToken } from '../resp/protocol/redis-token';
import { IRequest } from './request';
export interface ICmdReq {
  command: IRespCommand;
  request: IRequest;
}
export abstract class Session {
  public abstract inTransaction(): boolean;
  public abstract queueRequest(cmdReq: ICmdReq ): void;
  public abstract abortTransaction(): boolean;
  public abstract startTransaction(): boolean;
  public abstract getId(): string;
  public abstract getName(): string;
  public abstract setName(name: string): void;
  public abstract publish(message: RedisToken | Promise<RedisToken>): void;
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
  public abstract getTransaction(): ICmdReq[];
}
