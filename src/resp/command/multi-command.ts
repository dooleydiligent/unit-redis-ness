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
export class MultiCommand implements IRespCommand {
  protected logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): Promise<RedisToken> {
    return new Promise((resolve: any) => {
      this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
      if (!request.getSession().inTransaction()) {
        request.getSession().startTransaction();
        resolve(RedisToken.responseOk());
      } else {
        resolve(RedisToken.error(`ERR MULTI calls can not be nested`));
      }
    });
  }
}
