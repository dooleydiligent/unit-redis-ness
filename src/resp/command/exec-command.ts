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
export class ExecCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    if (!request.getSession().inTransaction()) {
      return (RedisToken.error(`ERR EXEC without MULTI`));
    } else {
      if (request.getSession().isErrored()) {
        request.getSession().abortTransaction();
        return (RedisToken.error(`EXECABORT Transaction discarded because of previous errors.`));
      } else {
        const commands: ICmdReq[] = request.getSession().getTransaction();
        const tokens: RedisToken[] = [];
        commands.map((cmdReq) => {
          this.logger.debug(`Executing transaction command ${cmdReq.request.getCommand()}`);
          tokens.push(cmdReq.command.execSync(cmdReq.request, db));
        });
        return (RedisToken.array(tokens));
      }
    }
  }
}
