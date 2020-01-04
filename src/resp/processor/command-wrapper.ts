import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { Session } from '../../server/session';
import { DataType } from '../data/data-type';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './command/resp-command';

export class CommandWrapper implements IRespCommand {
  public isDbCommand: boolean = false;
  public maxParams: number = -1;
  public minParams: number = -1;
  public isRespCommand: boolean = false;
  public dataType: DataType;
  public pubSubAllowed: boolean;
  public txIgnore: boolean;
  public readOnly: boolean;
  private logger: Logger = new Logger(module.id);
  constructor(private command: any) {
    this.dataType = command.dataType;
    this.readOnly = !!command.readOnly;
    this.txIgnore = !!command.txIgnore;
    this.pubSubAllowed = !!command.pubSubAllowed;
    this.isRespCommand = !!command.isRespCommand;
    this.minParams = +command.minParams;
    this.maxParams = +command.maxParams;
  }
  public isReadOnly(): boolean {
    return this.readOnly;
  }
  public isTxIgnore(): boolean {
    return this.txIgnore;
  }
  public isPubSubAllowed(): boolean {
    return this.pubSubAllowed;
  }
  public execute(request: IRequest): RedisToken {
    this.logger.debug(`execute(${request})`);
    const db: Database = this.getCurrentDB(request);
    this.logger.debug(`db is ${JSON.stringify(db)}`);
    this.logger.debug(`Request param 0 is ${JSON.stringify(request.getParam(0))}`);
    this.logger.debug(`PARAMS Is/Are`, request.getParams());
    switch (true) {
      case request.getLength() < this.minParams || request.getLength() > this.maxParams:
        return RedisToken.error(
          `ERR wrong number of arguments for '${request.getCommand()}' command`);
      case !!this.command.isDbCommand && this.dataType &&
        this.dataType !== DataType.NONE &&
        !db.isType(request.getParam(0).toString(), this.dataType):
        return RedisToken.error(
          `WRONGTYPE Operation against a key holding the wrong kind of value`);
      case this.isSubscribed(request) && !this.pubSubAllowed:
        return RedisToken.error(
          `ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context`);
      case this.isTxActive(request) && !this.txIgnore:
        this.enqueueRequest(request);
        return RedisToken.status(`QUEUED`);
      default:
        if (this.command.isDbCommand) {
          this.logger.debug(`Executing DB Command ${request.getCommand()} with params `, request.getParams());
          return this.executeDBCommand(request, db);
        } else if (this.command.isRespCommand) {
          this.logger.debug(`Executing RESP Command ${request.getCommand()} with params `, request.getParams());
          return this.executeCommand(request);
        }
        this.logger.warn(`Could not execute command ${request.getCommand()} with params `, request.getParams());
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
    return request.getServerContext().getValue('db');
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
