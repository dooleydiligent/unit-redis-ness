import { Logger } from '../logger';
import { IRespCommand } from '../resp/command/resp-command';
import { RedisToken } from '../resp/protocol/redis-token';
import { IRequest } from './request';
export interface ICmdReq {
  command: IRespCommand;
  request: IRequest;
}
export abstract class Session {
  protected logger: Logger = new Logger(module.id);
  protected commands: ICmdReq[] = [];
  private errored: boolean = false;
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

  public setError(): void {
    this.errored = true;
  }
  public isErrored(): boolean {
    return this.errored;
  }
  public queueRequest(cmdReq: ICmdReq): void {
    this.commands.push(cmdReq);
  }
  public abortTransaction(): boolean {
    if (this.inTransaction()) {
      delete this.commands;
      this.errored = false;
      return true;
    } else {
      return false;
    }
  }
  public getTransaction(): ICmdReq[] {
    const retVal: ICmdReq[] = this.commands;
    delete this.commands;
    return retVal;
  }
  public inTransaction(): boolean {
    if (this.commands === undefined) {
      this.logger.debug(`inTransaction(FALSE) = ${this.commands !== undefined}`);
      return false;
    } else {
      this.logger.debug(`inTransaction(TRUE) = ${this.commands !== undefined}`);
      return true;
    }
  }
  public startTransaction(): boolean {
    if (this.inTransaction()) {
      delete this.commands;
      return false;
    }
    this.commands = [];
    this.errored = false;
    return true;
  }
}
