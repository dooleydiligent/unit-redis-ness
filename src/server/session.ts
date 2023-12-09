import {Dictionary} from "../dictionary";
import {Logger} from "../logger";
import {IRespCommand} from "../resp/command/resp-command";
import {RedisToken} from "../resp/protocol/redis-token";
import {TimedEmitter} from "../timed-emitter";
import {IRequest} from "./request";
export interface ICmdReq {
  command: IRespCommand;
  request: IRequest;
}
export abstract class Session {
  protected logger: Logger = new Logger(module.id);

  protected commands?: ICmdReq[] = [];

  private subscriptions: Dictionary<string, TimedEmitter> = new Dictionary();

  private errored: boolean = false;

  public abstract getId(): string;

  public abstract getName(): string;

  public abstract setName(name: string): void;

  public abstract publish(message: RedisToken): void;

  public abstract close(): void;

  public abstract getValue(key: string): any;

  public abstract putValue(key: string, value: any): void;

  public abstract removeValue(key: string): any;

  public abstract getAddress(): string;

  public abstract getCurrentDb(): number;

  public abstract setCurrentDb(db: number): void;

  public abstract getLastCommand(): string;

  public abstract setLastCommand(command: string): void;

  public isSubscribed(channel: string): boolean {
      return this.subscriptions.exists(channel);
  }

  public subscribe(channel: string, emitter: TimedEmitter): void {
      this.subscriptions.put(
          channel,
          emitter
      );
  }

  public getSubscription(channel: string): TimedEmitter {
      return this.subscriptions.get(channel);
  }

  public unSubscribe(channel: string): void {
      if (this.isSubscribed(channel)) {
          const emitter: TimedEmitter = this.subscriptions.get(channel);
          emitter.off(
              channel,
              emitter.callback
          );
          this.subscriptions.remove(channel);
      }
  }

  public getSubscriptionNames(): string[] {
      return this.subscriptions.keys();
  }

  public setError(): void {
      this.errored = true;
  }

  public isErrored(): boolean {
      return this.errored;
  }

  public queueRequest(cmdReq: ICmdReq): void {
      if (!this.commands) {
          this.commands = [cmdReq];
      } else {
          this.commands.push(cmdReq);
      }
  }

  public abortTransaction(): boolean {
      if (this.inTransaction()) {
          delete this.commands;
          this.errored = false;
          return true;
      }

      return false;
  }

  public getTransaction(): ICmdReq[] {
      const retVal: ICmdReq[] = this.commands as ICmdReq[];
      if (this.commands) {
          delete this.commands;
      }
      return retVal;
  }

  public inTransaction(): boolean {
      if (this.commands === undefined) {
          this.logger.debug(`inTransaction(FALSE) = ${this.commands !== undefined}`);
          return false;
      }

      this.logger.debug(`inTransaction(TRUE) = ${this.commands !== undefined}`);
      return true;
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
