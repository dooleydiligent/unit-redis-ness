import * as net from 'net';
import { Dictionary } from '../dictionary';
import { Logger } from '../logger';
import { AbstractRedisToken } from '../resp/protocol/abstract-redis-token';
import { RespSerialize } from '../resp/protocol/resp-serialize';
import { Session } from './session';

// tslint:disable-next-line
const resp = require('resp');

export class DefaultSession implements Session {
  private state: Dictionary<string> = new Dictionary();
  private logger: Logger = new Logger(module.id)
    ;
  constructor(private id: string, private socket: net.Socket) {
  }
  public getId(): string {
    return this.id;
  }
  public publish(message: AbstractRedisToken<any>): void {
    // Send the message to the client
    this.logger.debug(`publish FROM: ${JSON.stringify(message)}`);
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
    return this.state.get(key);
  }
  public putValue(key: string, value: any): void {
    this.state.put(key, value);
  }
  public removeValue(key: string) {
    this.state.remove(key);
  }
}
