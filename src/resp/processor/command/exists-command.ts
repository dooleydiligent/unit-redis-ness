import { DbDataType, MaxParams, MinParams, Name } from '../../../decorators';
import { Logger } from '../../../logger';
import { IRequest } from '../../../server/request';
import { Database } from '../../data/database';
import { DataType } from '../../data/data-type';
import { RedisToken } from '../../protocol/redis-token';
import { IRespCommand } from './resp-command';
/**
 * Available since v1.0.0
 * 
 * EXISTS key [key...]
 * Returns if key exists.
 *
 * Since Redis 3.0.3 it is possible to specify multiple keys instead of a single one.
 * In such a case, it returns the total number of keys existing. Note that returning
 * 1 or 0 for a single key is just a special case of the variadic usage, so the command
 * is completely backward compatible.
 *
 * The user should be aware that if the same existing key is mentioned in the arguments
 * multiple times, it will be counted multiple times. So if somekey exists,
 * EXISTS somekey somekey will return 2.
 *
 * Return value
 * Integer reply, specifically:
 * 
 * 1 if the key exists.
 * 0 if the key does not exist.
 * Since Redis 3.0.3 the command accepts a variable number of keys and the return value
 * is generalized:
 * 
 * The number of keys existing among the ones specified as arguments. Keys mentioned
 * multiple times and existing are counted multiple times.
 */
@DbDataType(DataType.STRING)
@MaxParams(-1)
@MinParams(1)
@Name('exists')
export class ExistsCommand implements IRespCommand {
  private logger: Logger = new Logger(module.id);
  public execute(request: IRequest, db: Database): RedisToken {
    this.logger.debug(`execute(request, db)`, request.getParams());
    let counter = 0;
    for (const key of request.getParams()) {
      if (db.exists(key)) {
        ++counter;
      }
    }
    return RedisToken.integer(counter);
  }
}
