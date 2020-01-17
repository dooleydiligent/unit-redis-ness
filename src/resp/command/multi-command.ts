import { MaxParams, MinParams, Name } from '../../decorators';
import { Logger } from '../../logger';
import { IRequest } from '../../server/request';
import { Database } from '../data/database';
import { RedisToken } from '../protocol/redis-token';
import { IRespCommand } from './resp-command';
/**
 * ### Available since 1.2.0.
 * ### MULTI
 *
 * Marks the start of a transaction block. Subsequent commands will be queued for atomic
 * execution using [EXEC]{@link ExecCommand}.
 * ### Return value
 * Simple string reply: always OK.
 */
@MinParams(0)
@MaxParams(0)
@Name('multi')
export class MultiCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    if (!request.getSession().inTransaction()) {
      request.getSession().startTransaction();
      return (RedisToken.responseOk());
    } else {
      return (RedisToken.error(`ERR MULTI calls can not be nested`));
    }
  }
}
