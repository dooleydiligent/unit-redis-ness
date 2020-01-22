import { Logger } from '../logger';
import { RedisToken } from '../resp/protocol/redis-token';
import { IRequest } from './request';
import { IServerContext } from './server-context';
import { Session } from './session';

export class DefaultRequest implements IRequest {
  private logger: Logger = new Logger(module.id);
  constructor(
    private server: IServerContext,
    private session: Session,
    private command: string,
    private params: string[]) {
    this.logger.debug(`constructor(server, ${session.getId()}, ${command}, ${params})`);
  }
  public getCommand(): string {
    return this.command.toString();
  }
  public getParams(): string[] {
    return this.params;
  }
  public getParam(index: number): string {
    if (index < this.params.length) {
      return this.params[index];
    }
    return '';
  }
  public getLength(): number {
    return this.params.length;
  }
  public getSession(): Session {
    return this.session;
  }
  public getServerContext(): IServerContext {
    return this.server;
  }
  public toString(): string {
    return `${this.command}[${this.params.length}]: ${this.params}`;
  }
}
