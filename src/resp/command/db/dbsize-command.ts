import { MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { Database } from '../../data/database';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from '../resp-command';
/**
 * Available since 1.0.0.
 *
 * DBSIZE
 *
 * Return the number of keys in the currently-selected database.
 *
 * Return value:
 *
 * Integer reply
 */
@MaxParams(0)
@MinParams(0)
@Name('dbsize')
export class DBSizeCommand extends IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execSync(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`${request.getCommand()}.execute(%s)`, request.getParams());
    const count: number = db.keys().length;
    this.logger.debug(`Returning ${count}`);
    return (RedisToken.integer(count));
  }
}
