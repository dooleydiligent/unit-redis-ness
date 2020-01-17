import { MaxParams, MinParams, Name } from '../../decorators';
import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './resp-command';
/**
 * ### Available since 2.0.0.
 * ### DISCARD
 * Flushes all previously queued commands in a transaction and restores the connection state
 * to normal.
 *
 * If [WATCH]{@link WatchCommand} was used, DISCARD unwatches all keys watched by the connection.
 * ### Return value
 * Simple string reply: always OK.
 */
@MinParams(0)
@MaxParams(0)
@Name('discard')
export class DiscardCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    if (!request.getSession().inTransaction()) {
      return (RedisToken.error(`ERR DISCARD without MULTI`));
    } else {
      request.getSession().abortTransaction();
      return (RedisToken.responseOk());
    }
  }
}
