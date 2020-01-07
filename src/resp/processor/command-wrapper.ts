import * as util from 'util';
import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { Session } from '../../server/session';
import { DataType } from '../data/data-type';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './command/resp-command';

export class CommandWrapper implements IRespCommand {
  public maxParams: number = -1;
  public minParams: number = -1;
  public dataType: DataType = DataType.NONE;
  public pubSubAllowed: boolean;
  public txIgnore: boolean;
  private logger: Logger = new Logger(module.id);
  constructor(private command: IRespCommand) {
    this.logger.info(`Instantiating command ${(command as any).name}`);
    if (command.dataType) {
      this.dataType = command.dataType;
    }
    this.txIgnore = !!command.txIgnore;
    this.pubSubAllowed = !!command.pubSubAllowed;
    // We have to set these values
    this.minParams = +(command as any).minParams;
    this.maxParams = +(command as any).maxParams;
  }
  public isTxIgnore(): boolean {
    return this.txIgnore;
  }
  public isPubSubAllowed(): boolean {
    return this.pubSubAllowed;
  }
  public execute(request: IRequest): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    this.logger.debug(`db id is ${request.getSession().getCurrentDb()}`);
    const db: Database = this.getCurrentDB(request);
    this.logger.debug(`COMMAND is ${request.getCommand()}`);
    this.logger.debug(`PARAMS Is/Are`, request.getParams());
    switch (true) {
      case request.getLength() < this.minParams || (this.maxParams > -1 && request.getLength() > this.maxParams):
        this.logger.debug(`getLength() is ${request.getLength()}, minParams is ${this.minParams}, maxParams is ${this.maxParams}`);
        return RedisToken.error(
          `ERR wrong number of arguments for '${request.getCommand()}' command`);
      case this.dataType !== DataType.NONE &&
        !db.isType(request.getParam(0), this.dataType):
        this.logger.debug(`Check type for ${request.getParam(0)} against ${this.dataType}`);
        return RedisToken.error(
          `WRONGTYPE Operation against a key holding the wrong kind of value`);
      case this.isSubscribed(request) && !this.pubSubAllowed:
        return RedisToken.error(
          `ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context`);
      case this.isTxActive(request) && !this.txIgnore:
        this.enqueueRequest(request);
        return RedisToken.status(`QUEUED`);
      default:
        if (this.dataType) {
          this.logger.debug(`Executing DB Command ${request.getCommand()} with params [%s]`, request.getParams());
          const retVal: RedisToken = this.executeDBCommand(request, db);
          this.logger.debug(`DBCommand returned %j`, retVal);
          return retVal;
        } else {
          if (!!(this.command as any).name ) {
            this.logger.debug(`Executing RESP Command ${request.getCommand()} with params [%s]`, request.getParams());
            return this.executeCommand(request);
          }
        }
        this.logger.warn(`Could not execute command ${request.getCommand()} with params [%s]`, request.getParams());
        return RedisToken.error(`invalid command type: ${this.command.constructor.name}`);
    }
  }
  private executeCommand(request: IRequest): RedisToken {
    return this.command.execute(request);
  }
  private executeDBCommand(request: IRequest, db: Database): RedisToken {
    return this.command.execute(request, db);
  }
  private enqueueRequest(request: IRequest): void {
    const tx = this.getTransactionState(request.getSession());
    // .ifPresent(tx -> tx.enqueue(request));
    tx.enqueue(request);
  }

  private isTxActive(request: IRequest): boolean {
    const isPresent = this.getTransactionState(request.getSession());
    return (isPresent && isPresent.isPresent());
    //    return this.getTransactionState(request.getSession()).isPresent();
  }

  private getTransactionState(session: Session): any { // Option<TransactionState>
    return session.getValue('tx');
  }

  private getCurrentDB(request: IRequest): Database {
    return request.getServerContext().getDatabase(request.getSession().getCurrentDb());
    // const serverState: DBServerState = this.getServerState(request.getServerContext());
    // const sessionState: DBSessionState = this.getSessionState(request.getSession());
    // return serverState.getDatabase(sessionState.getCurrentDB());
  }

  // private getServerState(server: ServerContext): DBServerState {
  //   return serverState(server).getOrElseThrow(() -> new IllegalStateException('missing server state'));
  // }

  // private getSessionState(session: Session): DBSessionState {
  //   return this.sessionState(session).getOrElseThrow(() -> new IllegalStateException('missing session state'));
  // }

  // private Option<DBServerState> serverState(ServerContext server) {
  //   return server.getValue('state');
  // }

  // private Option<DBSessionState> sessionState(Session session) {
  //   return session.getValue('state');
  // }

  private isSubscribed(request: IRequest): boolean {
    // return this.getSessionState(request.getSession()).isSubscribed();
    return request.getSession().getValue('subscribed') === true;
  }
}
