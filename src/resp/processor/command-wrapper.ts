import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { ICmdReq, Session } from '../../server/session';
import { IRespCommand } from '../command/resp-command';
import { DataType } from '../data/data-type';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
export class CommandWrapper implements IRespCommand {
  public maxParams: number = -1;
  public minParams: number = -1;
  public dataType: DataType = DataType.NONE;
  public pubSubAllowed: boolean;
  // public txIgnore: boolean;
  private logger: Logger = new Logger(module.id);
  constructor(private command: IRespCommand) {
    this.logger.info(`Instantiating command ${(command as any).name}`);
    if (command.dataType) {
      this.dataType = command.dataType;
    }
    // this.txIgnore = !!command.txIgnore;
    this.pubSubAllowed = !!command.pubSubAllowed;
    // We have to set these values
    this.minParams = +(command as any).minParams;
    this.maxParams = +(command as any).maxParams;
  }
  // public isTxIgnore(): boolean {
  //   return this.txIgnore;
  // }
  public isPubSubAllowed(): boolean {
    return this.pubSubAllowed;
  }
  public execute(request: IRequest): Promise<RedisToken> {
    return new Promise((resolve) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      this.logger.debug(`db id is ${request.getSession().getCurrentDb()}`);
      const db: Database = this.getCurrentDB(request);
      this.logger.debug(`COMMAND is ${request.getCommand()}`);
      this.logger.debug(`PARAMS Is/Are`, request.getParams());
      switch (true) {
        case request.getLength() < this.minParams || (this.maxParams > -1 && request.getLength() > this.maxParams):
          if (request.getSession().inTransaction()) {
            request.getSession().setError();  // Send EXECABORT if EXEC is called later
          }
          this.logger.debug(`getLength() is ${request.getLength()}, minParams is ${this.minParams}, maxParams is ${this.maxParams}`);
          resolve(RedisToken.error(
            `ERR wrong number of arguments for '${request.getCommand()}' command`));
          break;
        case this.dataType !== DataType.NONE &&
          !db.isType(request.getParam(0), this.dataType):
          if (request.getSession().inTransaction()) {
            request.getSession().setError();  // Send EXECABORT if EXEC is called later
          }
          this.logger.debug(`Check type for ${request.getParam(0)} against ${this.dataType}`);
          resolve(RedisToken.error(
            `WRONGTYPE Operation against a key holding the wrong kind of value`));
          break;
        case this.isSubscribed(request) && !this.pubSubAllowed:
          resolve(RedisToken.error(
            `ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context`));
          break;
        // case this.isTxActive(request) && !this.txIgnore:
        //   this.enqueueRequest(request);
        //   resolve(RedisToken.status(`QUEUED`));
        //   break;
        default:
          if (
            request.getSession().inTransaction() &&
            'exec discard multi'.indexOf(request.getCommand().toLowerCase()) === -1) {
            this.logger.debug(
              `Adding command to transaction for command "${request.getCommand()}" with params [%s]`,
              request.getParams()
            );
            request.getSession().queueRequest({ command: this.command, request});
            resolve(RedisToken.string('QUEUED'));
            return;
          } else {
            if (this.dataType) {
              this.logger.debug(`Executing DB Command "${request.getCommand()}" with params [%s]`, request.getParams());
              const retVal: Promise<RedisToken> = this.executeDBCommand(request, db);
              this.logger.debug(`DBCommand returned %j`, retVal);
              resolve(retVal);
              return;
            } else {
              if (!!(this.command as any).name) {
                this.logger.debug(
                  `Executing RESP Command "${request.getCommand()}" with params [%s]`,
                  request.getParams()
                );
                resolve(this.executeCommand(request));
                return;
              }
            }
          }
          this.logger.warn(`Could not execute command ${request.getCommand()} with params [%s]`, request.getParams());
          resolve(RedisToken.error(`invalid command type: ${this.command.constructor.name}`));
      }
    });
  }
  private executeCommand(request: IRequest): Promise<RedisToken> {
    return this.command.execute(request);
  }
  private executeDBCommand(request: IRequest, db: Database): Promise<RedisToken> {
    return this.command.execute(request, db);
  }
  // private enqueueRequest(request: IRequest): void {
  //   const tx = this.getTransactionState(request.getSession());
  //   // .ifPresent(tx -> tx.enqueue(request));
  //   tx.enqueue(request);
  // }

  // private isTxActive(request: IRequest): boolean {
  //   const isPresent = this.getTransactionState(request.getSession());
  //   return (isPresent && isPresent.isPresent());
  //   //    return this.getTransactionState(request.getSession()).isPresent();
  // }

  // private getTransactionState(session: Session): any { // Option<TransactionState>
  //   return session.getValue('tx');
  // }

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
