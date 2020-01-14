import * as net from 'net';
import * as util from 'util';
import { Dictionary } from '../dictionary';
import { Logger } from '../logger';
import { IRespCommand } from '../resp/command/resp-command';
import { AbstractRedisToken } from '../resp/protocol/abstract-redis-token';
import { RespSerialize } from '../resp/protocol/resp-serialize';
import { ICmdReq, Session } from './session';

// tslint:disable-next-line
const resp = require('resp');

export class DefaultSession implements Session {
  private state: Dictionary<string, string> = new Dictionary();
  private name: string = '';
  private logger: Logger = new Logger(module.id);
  private currentDb: number = 0;
  private lastCommand: string = '';
  private commands: ICmdReq[] = [];
  constructor(private id: string, private socket: net.Socket) {
    delete this.commands;
    this.logger.debug(`constructor() - this.commands is ${this.commands}`);
  }
  public queueRequest(cmdReq: ICmdReq): void {
    this.commands.push(cmdReq);
  }
  public abortTransaction(): boolean {
    if (this.inTransaction()) {
      delete this.commands;
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
    return true;
  }
  public getAddress(): string {
    return util.format('%s:%d', this.socket.remoteAddress, this.socket.remotePort);
  }
  public getId(): string {
    return this.id;
  }
  public publish(message: AbstractRedisToken<any>): void {
    // Send the message to the client
    this.logger.debug(`publish FROM: ${util.inspect(message)}`);
    const respResponse = new RespSerialize(message).serialize();
    this.logger.debug(`publish TO: ${respResponse}`);
    this.socket.write(Buffer.from(respResponse));
  }
  public close(): void {
    // noop
  }
  public destroy(): void {
    this.state.clear();
    this.socket.destroy();
  }
  public getValue(key: string) {
    this.logger.debug(`getValue(${key}: ${this.state.get(key)}`);
    return this.state.get(key);
  }
  public putValue(key: string, value: any): void {
    this.logger.debug(`putValue(${key}, ${value})`);
    this.state.put(key, value);
  }
  public removeValue(key: string) {
    this.logger.debug(`removeValue(${key})`);
    this.state.remove(key);
  }
  public getCurrentDb(): number {
    return this.currentDb;
  }
  public getLastCommand(): string {
    return this.lastCommand;
  }
  public setCurrentDb(db: number): void {
    this.currentDb = db;
  }
  public setLastCommand(cmd: string): void {
    this.lastCommand = cmd;
  }
  public setName(name: string): void {
    this.name = name;
  }
  public getName(): string {
    return this.name;
  }
}
