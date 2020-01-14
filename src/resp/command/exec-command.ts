import { MaxParams, MinParams, Name } from '../../decorators';
import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { ICmdReq } from '../../server/session';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './resp-command';
/**
 * ### Available since 1.2.0.
 * ### EXEC
 * Executes all previously queued commands in a transaction and restores the connection state
 * to normal.
 *
 * When using [WATCH]{@link WatchCommand}, EXEC will execute commands only if the watched keys were not modified,
 * allowing for a check-and-set mechanism.
 * ### Return value
 * Array reply: each element being the reply to each of the commands in the atomic transaction.
 *
 * When using [WATCH]{@link WatchCommand}, EXEC can return a Null reply if the execution was aborted.
 */
@MinParams(0)
@MaxParams(0)
@Name('exec')
export class ExecCommand implements IRespCommand {
  protected logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve: any) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      if (!request.getSession().inTransaction()) {
        resolve(RedisToken.error(`ERR EXEC without MULTI`));
      } else {
        const commands: ICmdReq[] = request.getSession().getTransaction();
        Promise.all(commands.map(async (cmdReq) => {
          this.logger.debug(`Executing transaction command ${cmdReq.request.getCommand()}`);
          return await cmdReq.command.execute(cmdReq.request, db);
        })).
          then((tokens: RedisToken[]) => {
            resolve(RedisToken.array(tokens));
          });
      }
    });
  }
}
